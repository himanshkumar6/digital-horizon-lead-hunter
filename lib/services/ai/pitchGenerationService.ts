import { GoogleGenAI } from '@google/genai';
import { OutreachPitchResult, LeadCandidate, Lead } from '@/types/lead';

export interface PitchGenerationInput {
  business_name: string;
  category: string;
  city: string;
  has_website: boolean;
  has_instagram: boolean;
  instagram_url?: string | null;
  phone?: string | null;
  rating?: number;
  review_count?: number;
  opportunity_reason?: string;
  lead_temperature?: string;
  notes?: string;
}

export class PitchGenerationService {
  private getApiKey(): string | null {
    const key = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
    if (key && key.trim() !== '' && !key.includes('MY_GEMINI_API_KEY') && !key.includes('MY_AI_API_KEY')) {
      return key.trim();
    }
    return null;
  }

  public async generatePitch(lead: PitchGenerationInput | Lead | LeadCandidate): Promise<OutreachPitchResult> {
    const apiKey = this.getApiKey();

    if (apiKey) {
      try {
        return await this.generateWithGemini(lead, apiKey);
      } catch (err) {
        console.error('[PitchGenerationService] Gemini API call failed, falling back to smart template:', err);
      }
    }

    return this.generateDeterministicPitch(lead);
  }

  private async generateWithGemini(lead: PitchGenerationInput, apiKey: string): Promise<OutreachPitchResult> {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
You are a senior digital growth consultant at Digital Horizon Solutions, helping local businesses upgrade their web presence and convert footfall/social traffic into customers.

Generate 3 tailored outreach messages for the following local business:
- Business Name: ${lead.business_name}
- Category: ${lead.category}
- City: ${lead.city}
- Has Dedicated Website: ${lead.has_website ? 'Yes' : 'NO (They have NO dedicated website)'}
- Has Instagram Profile: ${lead.has_instagram ? 'Yes' : 'No'}
- Instagram URL / Handle: ${lead.instagram_url || 'Not listed'}
- Google Rating & Reviews: ${lead.rating ? `${lead.rating} stars` : 'N/A'}, ${lead.review_count || 0} reviews
- Opportunity Assessment: ${lead.opportunity_reason || 'Local business looking to scale digital visibility'}
${lead.notes ? `- Additional context: ${lead.notes}` : ''}

RULES:
- Tone: Professional, human, conversational, concise, respectful, NEVER spammy, NEVER salesy or pushy.
- Do NOT fabricate fake statistics, awards, or false personal relations.
- Highlight the exact opportunity naturally:
  * If they have Instagram but NO website: compliment their active visual brand/catalog on Instagram, and gently explain that a fast mobile website/catalog helps buyers order or book directly without having to wait on DM replies.
  * If they have NO website: explain how local buyers searching in ${lead.city} can find their address, phone, and catalogue directly.
- The 3 formats required:
  1. instagram_dm: Short, punchy (under 60 words), friendly greeting, specific compliment, low-friction question.
  2. whatsapp_message: Professional yet direct, easy to read on mobile screen with line breaks, 1 clear call-to-action (e.g. sharing a quick 60-second preview link).
  3. email: Professional subject line, warm opening, observation about their digital presence in ${lead.city}, how a modern web showcase solves friction, gentle closing.
- Return ONLY valid JSON adhering to this exact JSON schema:
{
  "instagram_dm": "string",
  "whatsapp_message": "string",
  "email": {
    "subject": "string",
    "body": "string"
  },
  "key_value_points": ["point 1", "point 2", "point 3"],
  "recommended_call_to_action": "string"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '';
    const parsed = JSON.parse(rawText);

    return {
      business_name: lead.business_name,
      instagram_dm: parsed.instagram_dm,
      whatsapp_message: parsed.whatsapp_message,
      email: {
        subject: parsed.email?.subject || `Enhancing ${lead.business_name}'s digital presence in ${lead.city}`,
        body: parsed.email?.body || parsed.email,
      },
      key_value_points: Array.isArray(parsed.key_value_points) ? parsed.key_value_points : [
        `Capture local high-intent customers in ${lead.city}`,
        'Convert Instagram audience into automated inquiries & orders',
        'Speedy mobile-friendly catalog that requires zero maintenance',
      ],
      recommended_call_to_action: parsed.recommended_call_to_action || 'Offer a free 5-minute interactive mockup link showing how their business would look online.',
      provider_used: 'gemini-3.8-flash',
    };
  }

  public generateDeterministicPitch(lead: PitchGenerationInput): OutreachPitchResult {
    const name = lead.business_name;
    const cat = lead.category || 'business';
    const city = lead.city;
    const hasIg = lead.has_instagram;
    const hasWeb = lead.has_website;

    let dm = '';
    let wa = '';
    let emailSubject = '';
    let emailBody = '';

    if (!hasWeb && hasIg) {
      dm = `Hi ${name} team! 👋 Loved checking out your collection on Instagram. I noticed you have such great customer interest here, but no direct website where shoppers can browse your full catalogue or check prices without waiting for DM replies. We put together a quick 1-page mobile design preview for ${name}. Mind if I send the preview link over?`;
      
      wa = `Hi ${name}, hope you're having a productive week!

I came across your business while exploring top ${cat} providers in ${city}. Your Instagram page looks fantastic and clearly has great momentum!

I noticed that customers currently rely solely on DMs or phone calls to see your offerings since you don't have an active website. We recently helped another local brand in ${city} launch a quick mobile catalog that doubled their direct customer inquiries.

I made a quick 60-second concept mockup for ${name}. Would it be okay if I share the link here?`;

      emailSubject = `Quick idea for ${name}'s customer inquiries in ${city}`;
      emailBody = `Hi ${name} Team,

I came across your profile while reviewing established ${cat} businesses in ${city}. You clearly have strong customer sentiment and an active presence on Instagram.

One thing I noted was that shoppers who discover you on Google Maps or Instagram don't currently have a dedicated mobile website to browse your full catalogue, view pricing, or get in touch after hours.

At Digital Horizon Solutions, we build fast, ultra-clean web storefronts tailored specifically for ${cat} brands. We've already outlined a simple, high-converting concept layout specifically for ${name}.

Would you be open to a quick 5-minute look at the concept? No strings attached—just thought it would add immediate value to your current marketing.

Best regards,
Outreach Team
Digital Horizon Solutions`;
    } else if (!hasWeb) {
      dm = `Hello ${name}! Saw your top ratings on Google Maps for ${cat} in ${city}. You clearly run a solid operation. We noticed you don't currently have an official website listed for customer queries. We specialize in fast, simple business sites for ${cat} brands—would you like to see a quick complimentary mockup we sketched for you?`;

      wa = `Hello ${name},

I was looking at top-rated ${cat} businesses in ${city} and noticed your stellar Google reviews (${lead.rating ? `${lead.rating}★` : '4+★'})!

A lot of potential customers in ${city} search online daily, but you currently don't have an official website where they can view your services, timings, or request a quote directly.

We'd love to share a free interactive preview of what a modern web presence would look like for ${name}. Would you be open to seeing a quick preview?`;

      emailSubject = `Website & online inquiry concept for ${name}`;
      emailBody = `Dear ${name} Team,

Congratulations on building such a strong reputation in ${city}—your positive customer reviews on Google speak volumes about your quality.

While researching local leaders in the ${cat} sector, I noticed that you don't currently maintain an active web presence. This often means losing high-intent customers who search online to competitors who have instant booking or online catalogues.

We have drafted a clean, mobile-first website preview specifically designed for ${name} to showcase your offerings and capture incoming leads 24/7.

Could I share a 2-minute video preview with your team this week?

Warm regards,
Digital Horizon Solutions`;
    } else {
      dm = `Hi ${name} team! Impressive work in ${city}. I took a look at your website and Instagram. We noticed a couple of quick opportunities to speed up your mobile checkout and turn more social visitors into direct leads. Would you be open to a brief breakdown?`;

      wa = `Hi ${name},

Came across your ${cat} business in ${city}. Your offerings look great!

We help ${cat} brands upgrade their web conversion rates and speed up mobile page loads so social visitors from Instagram turn into immediate phone calls and leads.

Would you be open to a 2-minute review with a couple of quick improvement ideas?`;

      emailSubject = `Optimizing mobile conversions for ${name}`;
      emailBody = `Hi ${name} Team,

I came across your website and digital presence while researching ${cat} specialists in ${city}.

You have a solid foundation, but there are a few straightforward optimizations on mobile loading speeds and inquiry capture that could significantly increase your monthly leads from local searchers.

Would you have 5 minutes for a quick visual walkthrough of our recommendations?

Warm regards,
Digital Horizon Solutions`;
    }

    return {
      business_name: name,
      instagram_dm: dm,
      whatsapp_message: wa,
      email: {
        subject: emailSubject,
        body: emailBody,
      },
      key_value_points: [
        `Targeted for local ${cat} buyers in ${city}`,
        !hasWeb ? 'Captures customers searching on Google who need instant information' : 'Increases visitor-to-inquiry conversion rates',
        hasIg ? 'Smoothly bridges Instagram viewers into verified customers' : 'Establishes high-trust digital credibility',
      ],
      recommended_call_to_action: 'Offer a complimentary 60-second mockup preview link showing their branding.',
      provider_used: 'smart-template-engine',
    };
  }
}

export const pitchGenerationService = new PitchGenerationService();
