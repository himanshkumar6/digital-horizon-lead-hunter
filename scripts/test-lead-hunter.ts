import { leadScoringService, DEFAULT_SCORING_WEIGHTS } from '../lib/scoring/leadScoringService';
import { SearchRequestSchema, LeadStatusSchema } from '../lib/validators/leadValidators';
import { businessNormalizer, RawBusinessInput } from '../lib/services/search/normalizer';
import { pitchGenerationService } from '../lib/services/ai/pitchGenerationService';
import { dbRepository } from '../lib/supabase/db';

async function runTestSuite() {
  console.log('====================================================');
  console.log('🧪 RUNNING DIGITAL HORIZON — LEAD HUNTER TEST SUITE');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ FAIL: ${testName}${details ? ` -> ${details}` : ''}`);
    }
  }

  // ----------------------------------------------------
  // TEST 1: Lead Scoring Engine
  // ----------------------------------------------------
  console.log('\n--- 1. Testing Lead Scoring Service ---');
  
  // Prime target: No website, has IG, commercial, phone, rating 4.5, 120 reviews
  // 40 + 25 + 15 + 5 + 5 + 5 + 5 = 100
  const primeLead = leadScoringService.scoreLead({
    has_website: false,
    has_instagram: true,
    category: 'Jewellery Store',
    phone: '+91 98111 22334',
    rating: 4.8,
    review_count: 140,
  });

  assert(primeLead.score === 100, 'Prime opportunity gets max 100 score', `Got ${primeLead.score}`);
  assert(primeLead.temperature === 'HOT', 'Prime opportunity is HOT temperature', `Got ${primeLead.temperature}`);
  assert(primeLead.opportunity_reason.includes('Prime Website Conversion'), 'Correct opportunity reason generated');

  // Moderate lead: Has website (0), no IG (0), commercial (+15), phone (+5), rating 4.2 (+5), 60 reviews (+5)
  // Score: 30 -> LOW
  const existingSiteLead = leadScoringService.scoreLead({
    has_website: true,
    has_instagram: false,
    category: 'Bakery',
    phone: '+91 98111 00000',
    rating: 4.2,
    review_count: 60,
  });
  assert(existingSiteLead.score === 30, 'Has website gets lower score (30 pts)', `Got ${existingSiteLead.score}`);
  assert(existingSiteLead.temperature === 'LOW', 'Score 30 is LOW temperature');

  // Warm lead: No website (+40), no IG (0), commercial (+15), phone (+5), rating 4.1 (+5), 5 reviews (0) = 65 -> WARM
  const warmLead = leadScoringService.scoreLead({
    has_website: false,
    has_instagram: false,
    category: 'Dental Clinic',
    phone: '+91 98111 11111',
    rating: 4.1,
    review_count: 5,
  });
  assert(warmLead.score === 65, 'No-website local clinic scores 65', `Got ${warmLead.score}`);
  assert(warmLead.temperature === 'WARM', 'Score 65 is WARM temperature');

  // ----------------------------------------------------
  // TEST 2: Input Validation (Zod)
  // ----------------------------------------------------
  console.log('\n--- 2. Testing Input Validation ---');

  const validSearch = SearchRequestSchema.safeParse({
    city: 'Ghaziabad',
    niche: 'Jewellery',
    count: 25,
    filters: { noWebsiteOnly: true, minRating: 4.0 },
  });
  assert(validSearch.success, 'Valid search params pass Zod schema');

  const invalidCity = SearchRequestSchema.safeParse({
    city: 'A', // Too short (min 2)
    niche: 'Jewellery',
    count: 25,
  });
  assert(!invalidCity.success, 'City with 1 character fails validation');

  const validStatus = LeadStatusSchema.safeParse('INTERESTED');
  assert(validStatus.success, 'Status INTERESTED is valid enum');

  const invalidStatus = LeadStatusSchema.safeParse('RANDOM_STATUS');
  assert(!invalidStatus.success, 'Invalid status string rejected');

  // ----------------------------------------------------
  // TEST 3: Business Normalization & Deduplication
  // ----------------------------------------------------
  console.log('\n--- 3. Testing Normalizer & Deduplication ---');

  const rawBusinesses: RawBusinessInput[] = [
    {
      title: 'Kalyan Jewellers Ghaziabad',
      place_id: 'place_kalyan_123',
      address: 'RDC Raj Nagar, Ghaziabad',
      phone: '+91 120 445566',
      rating: 4.7,
      reviews: 320,
      website: 'https://instagram.com/kalyanjewellers_gzb', // Linked to IG!
    },
    {
      // DUPLICATE of first by place_id
      title: 'Kalyan Jewellers Ghaziabad Duplicate',
      place_id: 'place_kalyan_123',
      address: 'RDC Raj Nagar, Ghaziabad',
      phone: '+91 120 445566',
      rating: 4.7,
      reviews: 320,
    },
    {
      title: 'Tanishq Jewellery',
      place_id: 'place_tanishq_456',
      address: 'Ambedkar Road, Ghaziabad',
      website: 'https://www.tanishq.co.in', // Dedicated website!
      rating: 4.6,
      reviews: 500,
    },
  ];

  const normalized = businessNormalizer.normalizeBatch(rawBusinesses, 'Ghaziabad', 'Jewellery');
  assert(normalized.length === 2, 'Duplicates removed based on google_place_id', `Expected 2, got ${normalized.length}`);

  const kalyan = normalized.find((n) => n.google_place_id === 'place_kalyan_123');
  assert(kalyan !== undefined, 'Kalyan normalized successfully');
  assert(kalyan?.has_website === false, 'Instagram link correctly identified as NOT a dedicated website');
  assert(kalyan?.has_instagram === true, 'Instagram profile extracted correctly');
  assert(kalyan?.lead_score === 100, 'Kalyan scored as 100 (HOT)');

  const tanishq = normalized.find((n) => n.google_place_id === 'place_tanishq_456');
  assert(tanishq?.has_website === true, 'Tanishq has_website is true');

  // ----------------------------------------------------
  // TEST 4: Outreach Pitch Generator
  // ----------------------------------------------------
  console.log('\n--- 4. Testing AI Outreach Pitch Generator ---');

  const pitch = pitchGenerationService.generateDeterministicPitch({
    business_name: 'Royal Jewellers',
    category: 'Jewellery Store',
    city: 'Ghaziabad',
    has_website: false,
    has_instagram: true,
    rating: 4.7,
    review_count: 85,
  });

  assert(Boolean(pitch.instagram_dm), 'Instagram DM generated');
  assert(pitch.instagram_dm.includes('Royal Jewellers'), 'DM mentions business name');
  assert(Boolean(pitch.whatsapp_message), 'WhatsApp message generated');
  assert(Boolean(pitch.email.subject && pitch.email.body), 'Email subject and body generated');
  assert(pitch.email.subject.includes('Royal Jewellers'), 'Email subject personalized');

  // ----------------------------------------------------
  // TEST 5: Database Operations & Status Updates
  // ----------------------------------------------------
  console.log('\n--- 5. Testing Database Repository ---');

  const savedLead = await dbRepository.saveLead(kalyan!, 'NEW', 'First discovery in Ghaziabad');
  assert(Boolean(savedLead.id), 'Lead saved with ID');
  assert(savedLead.status === 'NEW', 'Initial status is NEW');

  // Update status to CONTACTED
  const updatedLead = await dbRepository.updateLead(savedLead.id, { status: 'CONTACTED' });
  assert(updatedLead?.status === 'CONTACTED', 'Lead status successfully updated to CONTACTED');

  // Add interaction note
  const note = await dbRepository.addNote(savedLead.id, 'Sent preview link via Instagram DM');
  assert(note.content === 'Sent preview link via Instagram DM', 'Note content recorded properly');

  const notesList = await dbRepository.getNotes(savedLead.id);
  assert(notesList.length >= 1, 'Notes list retrieved successfully');

  // Prevent duplicate place ID
  const duplicateSave = await dbRepository.saveLead(kalyan!);
  const allLeads = await dbRepository.getLeads({ searchQuery: 'Kalyan' });
  assert(allLeads.total === 1, 'Duplicate place ID prevents multiple records in DB');

  // Search History Recording
  const searchRec = await dbRepository.recordSearch({
    city: 'Ghaziabad',
    niche: 'Jewellery',
    requested_count: 20,
    found_count: 2,
  });
  assert(Boolean(searchRec.id), 'Search query logged to history');

  console.log('\n====================================================');
  console.log(`🏁 TEST SUMMARY: ${passedTests} / ${totalTests} passed`);
  console.log('====================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
