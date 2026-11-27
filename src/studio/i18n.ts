/**
 * Katha Studio — Global Multi-Language Engine (19 World & Indian Languages)
 *
 * Powers end-to-end multilingual creation & rendering:
 *  - Script-aware Canvas typography (Latin, Devanagari, Tamil, Telugu, Bengali,
 *    Gujarati, Kannada, Malayalam, Arabic/Urdu RTL, Japanese, Korean, Chinese)
 *  - Automatic Unicode script detection & RTL direction switching
 *  - Accurate spoken duration estimation for space-free CJK & Indic scripts
 *  - Localized on-canvas cards, Launch Pack templates, Editorial notes & AI prompts
 */
import type { EpisodeScript, FrameMode } from './types';

export type LanguageCode =
  | 'en'
  | 'hi'
  | 'ta'
  | 'te'
  | 'bn'
  | 'mr'
  | 'gu'
  | 'kn'
  | 'ml'
  | 'ur'
  | 'es'
  | 'pt'
  | 'fr'
  | 'de'
  | 'id'
  | 'ja'
  | 'ko'
  | 'zh'
  | 'ar';

export type ScriptType = 'latin' | 'indic' | 'arabic' | 'cjk' | 'hangul';

export interface LanguageSpec {
  code: LanguageCode;
  label: string;
  nativeName: string;
  bcp47: string;
  dir: 'ltr' | 'rtl';
  scriptType: ScriptType;
  fontFamily: string;
  displayFontFamily: string;
  voiceHint: string;
  storyWithinStory: string;
  moralHeader: string;
  culturalNoteTitle: string;
  culturalNoteLabel: string;
  thumbnailFallback: string;
  chaptersHeading: string;
  keyTakeawayHeading: string;
  subscribeCta: string;
  kidsCta: string;
  pinnedCommentPrompt: (lead: string, rival: string) => string;
  attributionFooter: (series: string) => string;
  culturalContextLine: (series: string, lead: string) => string;
}

const LATIN_SANS = '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
const LATIN_DISPLAY = '"Fraunces", Georgia, serif';

export const LANGUAGE_CATALOG: LanguageSpec[] = [
  {
    code: 'en',
    label: 'English',
    nativeName: 'English',
    bcp47: 'en-US',
    dir: 'ltr',
    scriptType: 'latin',
    fontFamily: LATIN_SANS,
    displayFontFamily: LATIN_DISPLAY,
    voiceHint: 'Classic prestige documentary storyteller cadence',
    storyWithinStory: 'STORY WITHIN STORY',
    moralHeader: 'MORAL OF THE TALE',
    culturalNoteTitle: 'Cultural Context & Modern Reflection',
    culturalNoteLabel: 'Storyteller · Cultural Note',
    thumbnailFallback: 'THE UNTOLD TALE',
    chaptersHeading: 'CHAPTERS:',
    keyTakeawayHeading: 'KEY TAKEAWAY:',
    subscribeCta: 'Subscribe for weekly animated Indian & World folklore adaptations and cultural breakdowns.',
    kidsCta: 'Explore more timeless illustrated world folklore adaptations on our channel.',
    pinnedCommentPrompt: (lead, rival) =>
      `What would YOU have done in ${lead}'s place against ${rival}? Drop your perspective below — and tell us which classic tale we should analyze & animate next!`,
    attributionFooter: (series) =>
      `ABOUT THIS ADAPTATION (ORIGINAL TRANSFORMATIVE WORK):\nInspired by traditional public-domain folklore (${series}). This episode features an original dramatized screenplay, custom-directed 2D animated staging & facial acting, regional musical scoring, and cultural commentary created specifically for this channel.`,
    culturalContextLine: (series, lead) =>
      `Passed down through ${series} oral tradition, this tale of ${lead} still resonates today because it exposes how human judgment holds up under pressure.`,
  },
  {
    code: 'hi',
    label: 'Hindi',
    nativeName: 'हिन्दी',
    bcp47: 'hi-IN',
    dir: 'ltr',
    scriptType: 'indic',
    fontFamily: `"Noto Sans Devanagari", ${LATIN_SANS}`,
    displayFontFamily: `"Noto Sans Devanagari", ${LATIN_DISPLAY}`,
    voiceHint: 'Warm Indian Kathavachak storyteller cadence in crisp natural Hindi',
    storyWithinStory: 'कथा के भीतर कथा',
    moralHeader: 'कहानी की सीख',
    culturalNoteTitle: 'सांस्कृतिक संदर्भ और आधुनिक सीख',
    culturalNoteLabel: 'कथावाचक · सांस्कृतिक टिप्पणी',
    thumbnailFallback: 'अनकही लोककथा',
    chaptersHeading: 'अध्याय:',
    keyTakeawayHeading: 'मुख्य सीख:',
    subscribeCta: 'हर सप्ताह नई एनिमेटेड भारतीय और विश्व लोककथाओं के लिए चैनल को सब्सक्राइब करें।',
    kidsCta: 'हमारे चैनल पर और भी कालजयी लोककथाएँ देखें।',
    pinnedCommentPrompt: (lead, rival) =>
      `यदि आप ${rival} के सामने ${lead} की जगह होते, तो क्या करते? नीचे कमेंट में बताएं और अगली कौन-सी लोककथा देखनी है, यह भी लिखें!`,
    attributionFooter: (series) =>
      `इस रूपांतरण के बारे में (मौलिक रचनात्मक कृति):\nपारंपरिक लोककथा (${series}) से प्रेरित। इस एपिसोड में मौलिक संवाद, विशेष 2D एनिमेशन निर्देशन, पारंपरिक संगीत और सांस्कृतिक विश्लेषण शामिल है।`,
    culturalContextLine: (series, lead) =>
      `सदियों से ${series} की मौखिक परंपरा में जीवित यह कथा बताती है कि कठिन परिस्थिति में ${lead} जैसी सूझबूझ आज भी सबसे बड़ी शक्ति है।`,
  },
  {
    code: 'ta',
    label: 'Tamil',
    nativeName: 'தமிழ்',
    bcp47: 'ta-IN',
    dir: 'ltr',
    scriptType: 'indic',
    fontFamily: `"Noto Sans Tamil", ${LATIN_SANS}`,
    displayFontFamily: `"Noto Sans Tamil", ${LATIN_DISPLAY}`,
    voiceHint: 'Expressive classical Tamil storytelling cadence',
    storyWithinStory: 'கதைக்குள் ஒரு கதை',
    moralHeader: 'கதையின் நீதி',
    culturalNoteTitle: 'பண்பாட்டு பின்னணி மற்றும் இன்றைய பாடம்',
    culturalNoteLabel: 'கதைசொல்லி · பண்பாட்டு குறிப்பு',
    thumbnailFallback: 'பழமையான கதை',
    chaptersHeading: 'அத்தியாயங்கள்:',
    keyTakeawayHeading: 'முக்கிய நீதி:',
    subscribeCta: 'வாராந்திர அனிமேஷன் நாட்டுப்புறக் கதைகளுக்கு எங்கள் சேனலை சப்ஸ்கிரைப் செய்யுங்கள்.',
    kidsCta: 'மேலும் பல பாரம்பரிய கதைகளை எங்கள் சேனலில் காணுங்கள்.',
    pinnedCommentPrompt: (lead, rival) =>
      `${rival} முன் ${lead} இடத்தில் நீங்கள் இருந்திருந்தால் என்ன செய்திருப்பீர்கள்? கீழே கருத்தில் பகிருங்கள்!`,
    attributionFooter: (series) =>
      `இந்த படைப்பைப் பற்றி (புதிய அனிமேஷன் தழுவல்):\nபாரம்பரிய நாட்டுப்புறக் கதையை (${series}) அடிப்படையாகக் கொண்ட புதிய திரைக்கதை, 2D அனிமேஷன், இசை மற்றும் பண்பாட்டு விளக்கம்.`,
    culturalContextLine: (series, lead) =>
      `${series} மரபில் தலைமுறைகளாகச் சொல்லப்படும் இந்தக் கதை, ${lead} காட்டிய அறிவும் நிதானமும் இன்றைய வாழ்க்கைக்கும் எவ்வளவு அவசியம் என்பதை உணர்த்துகிறது.`,
  },
  {
    code: 'te',
    label: 'Telugu',
    nativeName: 'తెలుగు',
    bcp47: 'te-IN',
    dir: 'ltr',
    scriptType: 'indic',
    fontFamily: `"Noto Sans Telugu", ${LATIN_SANS}`,
    displayFontFamily: `"Noto Sans Telugu", ${LATIN_DISPLAY}`,
    voiceHint: 'Warm Telugu Chandamama-style classic narration',
    storyWithinStory: 'కథలో మరో కథ',
    moralHeader: 'కథలోని నీతి',
    culturalNoteTitle: 'సాంస్కృతిక నేపథ్యం & ఆధునిక ఆలోచన',
    culturalNoteLabel: 'కథకుడు · సాంస్కృతిక విశ్లేషణ',
    thumbnailFallback: 'పురాతన కథ',
    chaptersHeading: 'అధ్యాయాలు:',
    keyTakeawayHeading: 'ముఖ్య సందేశం:',
    subscribeCta: 'ప్రతి వారం కొత్త యానిమేటెడ్ జానపద కథల కోసం సబ్‌స్క్రైబ్ చేయండి.',
    kidsCta: 'మరిన్ని క్లాసిక్ జానపద కథలను మా ఛానెల్‌లో చూడండి.',
    pinnedCommentPrompt: (lead, rival) =>
      `${rival} ఎదుట ${lead} స్థానంలో మీరు ఉంటే ఏం చేసేవారు? కింద కామెంట్‌లో చెప్పండి!`,
    attributionFooter: (series) =>
      `ఈ రూపకల్పన గురించి (మౌలిక సృజనాత్మక కథనం):\nసంప్రదాయ జానపద కథ (${series}) ఆధారంగా రూపొందించిన మౌలిక సంభాషణలు, 2D యానిమేషన్, సంగీతం మరియు సాంస్కృతిక విశ్లేషణ.`,
    culturalContextLine: (series, lead) =>
      `${series} సంప్రదాయంలో తరతరాలుగా నిలిచిన ఈ కథ, క్లిష్ట సమయంలో ${lead} చూపిన వివేకం నేటి కాలానికీ ఎంతో విలువైనదని చూపిస్తుంది.`,
  },
  {
    code: 'bn',
    label: 'Bengali',
    nativeName: 'বাংলা',
    bcp47: 'bn-IN',
    dir: 'ltr',
    scriptType: 'indic',
    fontFamily: `"Noto Sans Bengali", ${LATIN_SANS}`,
    displayFontFamily: `"Noto Sans Bengali", ${LATIN_DISPLAY}`,
    voiceHint: 'Literary Bengali Thakurmar Jhuli storytelling warmth',
    storyWithinStory: 'গল্পের ভেতরে গল্প',
    moralHeader: 'গল্পের শিক্ষা',
    culturalNoteTitle: 'সাংস্কৃতিক প্রেক্ষাপট ও আধুনিক ভাবনা',
    culturalNoteLabel: 'কথক · সাংস্কৃতিক টীকা',
    thumbnailFallback: 'অজানা লোককথা',
    chaptersHeading: 'অধ্যায়সমূহ:',
    keyTakeawayHeading: 'মূল শিক্ষা:',
    subscribeCta: 'প্রতি সপ্তাহে নতুন অ্যানিমেটেড লোককথা ও বিশ্লেষণের জন্য সাবস্ক্রাইব করুন।',
    kidsCta: 'আমাদের চ্যানেলে আরও চিরন্তন লোককথা দেখুন।',
    pinnedCommentPrompt: (lead, rival) =>
      `${rival}-এর সামনে ${lead}-এর জায়গায় আপনি থাকলে কী করতেন? কমেন্টে জানান!`,
    attributionFooter: (series) =>
      `এই রূপান্তর সম্পর্কে (মৌলিক সৃজনশীল কাজ):\nঐতিহ্যবাহী লোককথা (${series}) থেকে অনুপ্রাণিত মৌলিক চিত্রনাট্য, 2D অ্যানিমেশন, সংগীত ও সাংস্কৃতিক বিশ্লেষণ।`,
    culturalContextLine: (series, lead) =>
      `${series}-এর মৌখিক ঐতিহ্যে প্রজন্মের পর প্রজন্ম ধরে টিকে থাকা এই গল্পটি দেখায়, সংকটে ${lead}-এর মতো প্রজ্ঞাই প্রকৃত পথ দেখায়।`,
  },
  {
    code: 'mr',
    label: 'Marathi',
    nativeName: 'मराठी',
    bcp47: 'mr-IN',
    dir: 'ltr',
    scriptType: 'indic',
    fontFamily: `"Noto Sans Devanagari", ${LATIN_SANS}`,
    displayFontFamily: `"Noto Sans Devanagari", ${LATIN_DISPLAY}`,
    voiceHint: 'Crisp Marathi classical folk storytelling cadence',
    storyWithinStory: 'गोष्टीतली गोष्ट',
    moralHeader: 'कथेचे तात्पर्य',
    culturalNoteTitle: 'सांस्कृतिक संदर्भ आणि आजचा बोध',
    culturalNoteLabel: 'निवेदक · सांस्कृतिक टीप',
    thumbnailFallback: 'अनोखी लोककथा',
    chaptersHeading: 'भाग:',
    keyTakeawayHeading: 'मुख्य बोध:',
    subscribeCta: 'दर आठवड्याला नवीन अ‍ॅनिमेटेड लोककथांसाठी चॅनेलला सबस्क्राईब करा.',
    kidsCta: 'आमच्या चॅनेलवर आणखी अभिजात लोककथा पहा.',
    pinnedCommentPrompt: (lead, rival) =>
      `${rival} समोर तुम्ही ${lead} च्या जागी असता तर काय केले असते? खाली कमेंटमध्ये सांगा!`,
    attributionFooter: (series) =>
      `या रूपांतराबद्दल (मौलिक सर्जनशील कलाकृती):\nपारंपरिक लोककथेवर (${series}) आधारित मौलिक पटकथा, 2D अ‍ॅनिमेशन, संगीत आणि सांस्कृतिक भाष्य.`,
    culturalContextLine: (series, lead) =>
      `${series} च्या परंपरेतील ही कथा आजही महत्त्वाची आहे, कारण ती दाखवते की दबावाखाली ${lead} सारखा संयम आणि चातुर्यच विजयी ठरते.`,
  },
  {
    code: 'gu',
    label: 'Gujarati',
    nativeName: 'ગુજરાતી',
    bcp47: 'gu-IN',
    dir: 'ltr',
    scriptType: 'indic',
    fontFamily: `"Noto Sans Gujarati", ${LATIN_SANS}`,
    displayFontFamily: `"Noto Sans Gujarati", ${LATIN_DISPLAY}`,
    voiceHint: 'Warm Gujarati folk storyteller cadence',
    storyWithinStory: 'વાર્તામાં વાર્તા',
    moralHeader: 'વાર્તાનો બોધ',
    culturalNoteTitle: 'સાંસ્કૃતિક સંદર્ભ અને આજનો બોધ',
    culturalNoteLabel: 'વાર્તાકાર · સાંસ્કૃતિક નોંધ',
    thumbnailFallback: 'અનોખી લોકકથા',
    chaptersHeading: 'પ્રકરણો:',
    keyTakeawayHeading: 'મુખ્ય બોધ:',
    subscribeCta: 'દર અઠવાડિયે નવી એનિમેટેડ લોકકથાઓ માટે સબ્સ્ક્રાઇબ કરો.',
    kidsCta: 'અમારી ચેનલ પર વધુ અમર લોકકથાઓ જુઓ.',
    pinnedCommentPrompt: (lead, rival) =>
      `${rival} સામે તમે ${lead} ની જગ્યાએ હોત તો શું કરત? નીચે કોમેન્ટમાં જણાવો!`,
    attributionFooter: (series) =>
      `આ રૂપાંતરણ વિશે (મૌલિક સર્જનાત્મક કૃતિ):\nપરંપરાગત લોકકથા (${series}) પર આધારિત મૌલિક પટકથા, 2D એનિમેશન, સંગીત અને સાંસ્કૃતિક વિશ્લેષણ.`,
    culturalContextLine: (series, lead) =>
      `${series} ની લોકપરંપરામાંથી આવેલી આ કથા આજે પણ શીખવે છે કે મુશ્કેલ સમયમાં ${lead} જેવી સમજદારી જ સાચો માર્ગ બતાવે છે.`,
  },
  {
    code: 'kn',
    label: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    bcp47: 'kn-IN',
    dir: 'ltr',
    scriptType: 'indic',
    fontFamily: `"Noto Sans Kannada", ${LATIN_SANS}`,
    displayFontFamily: `"Noto Sans Kannada", ${LATIN_DISPLAY}`,
    voiceHint: 'Clear classical Kannada storytelling cadence',
    storyWithinStory: 'ಕಥೆಯೊಳಗೊಂದು ಕಥೆ',
    moralHeader: 'ಕಥೆಯ ನೀತಿ',
    culturalNoteTitle: 'ಸಾಂಸ್ಕೃತಿಕ ಹಿನ್ನೆಲೆ ಮತ್ತು ಇಂದಿನ ಪಾಠ',
    culturalNoteLabel: 'ಕಥೆಗಾರ · ಸಾಂಸ್ಕೃತಿಕ ಟಿಪ್ಪಣಿ',
    thumbnailFallback: 'ಪುರಾತನ ಕಥೆ',
    chaptersHeading: 'ಅಧ್ಯಾಯಗಳು:',
    keyTakeawayHeading: 'ಮುಖ್ಯ ಸಂದೇಶ:',
    subscribeCta: 'ಪ್ರತಿ ವಾರ ಹೊಸ ಅನಿಮೇಟೆಡ್ ಜಾನಪದ ಕಥೆಗಳಿಗಾಗಿ ಚಾನೆಲ್ ಸಬ್‌ಸ್ಕ್ರೈಬ್ ಮಾಡಿ.',
    kidsCta: 'ನಮ್ಮ ಚಾನೆಲ್‌ನಲ್ಲಿ ಇನ್ನಷ್ಟು ಶ್ರೇಷ್ಠ ಕಥೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ.',
    pinnedCommentPrompt: (lead, rival) =>
      `${rival} ಎದುರು ${lead} ಸ್ಥಾನದಲ್ಲಿ ನೀವಿದ್ದರೆ ಏನು ಮಾಡುತ್ತಿದ್ದಿರಿ? ಕಾಮೆಂಟ್ ಮಾಡಿ ತಿಳಿಸಿ!`,
    attributionFooter: (series) =>
      `ಈ ರೂಪಾಂತರದ ಬಗ್ಗೆ (ಮೂಲ ಸೃಜನಾತ್ಮಕ ಕೃತಿ):\nಸಾಂಪ್ರದಾಯಿಕ ಜಾನಪದ ಕಥೆ (${series}) ಆಧಾರಿತ ಮೂಲ ಚಿತ್ರಕಥೆ, 2D ಅನಿಮೇಷನ್, ಸಂಗೀತ ಮತ್ತು ಸಾಂಸ್ಕೃತಿಕ ವಿವರಣೆ.`,
    culturalContextLine: (series, lead) =>
      `${series} ಪರಂಪರೆಯಲ್ಲಿ ಸಾಗಿಬಂದ ಈ ಕಥೆ, ಒತ್ತಡದ ಸಮಯದಲ್ಲಿ ${lead} ತೋರಿದ ವಿವೇಕ ಇಂದಿಗೂ ಹೇಗೆ ದಾರಿದೀಪವಾಗಿದೆ ಎಂಬುದನ್ನು ತೋರಿಸುತ್ತದೆ.`,
  },
  {
    code: 'ml',
    label: 'Malayalam',
    nativeName: 'മലയാളം',
    bcp47: 'ml-IN',
    dir: 'ltr',
    scriptType: 'indic',
    fontFamily: `"Noto Sans Malayalam", ${LATIN_SANS}`,
    displayFontFamily: `"Noto Sans Malayalam", ${LATIN_DISPLAY}`,
    voiceHint: 'Expressive Malayalam folklore narration',
    storyWithinStory: 'കഥയ്ക്കുള്ളിലെ കഥ',
    moralHeader: 'കഥയുടെ ഗുണപാഠം',
    culturalNoteTitle: 'സാംസ്കാരിക പശ്ചാത്തലവും ഇന്നത്തെ പാഠവും',
    culturalNoteLabel: 'കഥാകാരൻ · സാംസ്കാരിക കുറിപ്പ്',
    thumbnailFallback: 'പഴയൊരു കഥ',
    chaptersHeading: 'അധ്യായങ്ങൾ:',
    keyTakeawayHeading: 'പ്രധാന സന്ദേശം:',
    subscribeCta: 'എല്ലാ ആഴ്ചയും പുതിയ ആനിമേറ്റഡ് നാടോടിക്കഥകൾക്കായി സബ്സ്ക്രൈബ് ചെയ്യൂ.',
    kidsCta: 'ഞങ്ങളുടെ ചാനലിൽ കൂടുതൽ ക്ലാസിക് കഥകൾ കാണുക.',
    pinnedCommentPrompt: (lead, rival) =>
      `${rival}-ന്റെ മുന്നിൽ ${lead}-ന്റെ സ്ഥാനത്ത് നിങ്ങളായിരുന്നെങ്കിൽ എന്തുചെയ്യുമായിരുന്നു? കമന്റ് ചെയ്യൂ!`,
    attributionFooter: (series) =>
      `ഈ ആവിഷ്കാരത്തെക്കുറിച്ച് (മൗലിക സൃഷ്ടി):\nപരമ്പരാഗത നാടോടിക്കഥയെ (${series}) ആസ്പദമാക്കിയ മൗലിക തിരക്കഥ, 2D ആനിമേഷൻ, സംഗീതം, സാംസ്കാരിക വിവരണം.`,
    culturalContextLine: (series, lead) =>
      `${series} പാരമ്പര്യത്തിലൂടെ കൈമാറപ്പെട്ട ഈ കഥ, പ്രതിസന്ധിയിൽ ${lead} കാണിച്ച വിവേകം ഇന്നും എത്ര പ്രസക്തമാണെന്ന് ഓർമ്മിപ്പിക്കുന്നു.`,
  },
  {
    code: 'ur',
    label: 'Urdu',
    nativeName: 'اردو',
    bcp47: 'ur-PK',
    dir: 'rtl',
    scriptType: 'arabic',
    fontFamily: `"Noto Sans Arabic", ${LATIN_SANS}`,
    displayFontFamily: `"Noto Sans Arabic", ${LATIN_SANS}`,
    voiceHint: 'Poetic Dastangoi Urdu storytelling cadence',
    storyWithinStory: 'کہانی کے اندر کہانی',
    moralHeader: 'کہانی کا سبق',
    culturalNoteTitle: 'ثقافتی پس منظر اور جدید سبق',
    culturalNoteLabel: 'داستان گو · ثقافتی نوٹ',
    thumbnailFallback: 'ان کہی داستان',
    chaptersHeading: 'ابواب:',
    keyTakeawayHeading: 'اہم سبق:',
    subscribeCta: 'ہر ہفتے نئی اینیمیٹڈ لوک کہانیوں اور تجزیوں کے لیے چینل سبسکرائب کریں۔',
    kidsCta: 'ہمارے چینل پر مزید کلاسیکی لوک کہانیاں دیکھیں۔',
    pinnedCommentPrompt: (lead, rival) =>
      `اگر آپ ${rival} کے سامنے ${lead} کی جگہ ہوتے تو کیا کرتے؟ کمنٹ میں اپنی رائے دیں!`,
    attributionFooter: (series) =>
      `اس پیشکش کے بارے میں (تخلیقی اور منفرد کام):\nروایتی لوک داستان (${series}) سے متاثر اصل اسکرپٹ، 2D اینیمیشن، موسیقی اور ثقافتی تبصرہ۔`,
    culturalContextLine: (series, lead) =>
      `${series} کی قدیم داستان گوئی سے جڑی یہ کہانی آج بھی ہمیں سکھاتی ہے کہ مشکل وقت میں ${lead} جیسی دانائی ہی اصل طاقت ہے۔`,
  },
  {
    code: 'es',
    label: 'Spanish',
    nativeName: 'Español',
    bcp47: 'es-ES',
    dir: 'ltr',
    scriptType: 'latin',
    fontFamily: LATIN_SANS,
    displayFontFamily: LATIN_DISPLAY,
    voiceHint: 'Rich theatrical Spanish documentary narration',
    storyWithinStory: 'HISTORIA DENTRO DE LA HISTORIA',
    moralHeader: 'MORALEJA DEL RELATO',
    culturalNoteTitle: 'Contexto Cultural y Reflexión Moderna',
    culturalNoteLabel: 'Narrador · Nota Cultural',
    thumbnailFallback: 'LA HISTORIA OCULTA',
    chaptersHeading: 'CAPÍTULOS:',
    keyTakeawayHeading: 'ENSEÑANZA CLAVE:',
    subscribeCta: 'Suscríbete para nuevos episodios semanales de folclore mundial animado y análisis cultural.',
    kidsCta: 'Descubre más fábulas clásicas ilustradas en nuestro canal.',
    pinnedCommentPrompt: (lead, rival) =>
      `¿Qué habrías hecho TÚ en el lugar de ${lead} frente a ${rival}? ¡Déjanos tu respuesta en los comentarios!`,
    attributionFooter: (series) =>
      `SOBRE ESTA ADAPTACIÓN (OBRA TRANSFORMADORA ORIGINAL):\nInspirada en el folclore tradicional de dominio público (${series}). Incluye guion dramatizado original, dirección animada 2D, música regional y comentario cultural creado para este canal.`,
    culturalContextLine: (series, lead) =>
      `Transmitida durante siglos en la tradición de ${series}, esta historia de ${lead} sigue vigente hoy porque revela cómo resiste el juicio humano bajo presión.`,
  },
  {
    code: 'pt',
    label: 'Portuguese',
    nativeName: 'Português',
    bcp47: 'pt-BR',
    dir: 'ltr',
    scriptType: 'latin',
    fontFamily: LATIN_SANS,
    displayFontFamily: LATIN_DISPLAY,
    voiceHint: 'Expressive Brazilian storyteller cadence',
    storyWithinStory: 'HISTÓRIA DENTRO DA HISTÓRIA',
    moralHeader: 'MORAL DA HISTÓRIA',
    culturalNoteTitle: 'Contexto Cultural e Reflexão Atual',
    culturalNoteLabel: 'Narrador · Nota Cultural',
    thumbnailFallback: 'A LENDA OCULTA',
    chaptersHeading: 'CAPÍTULOS:',
    keyTakeawayHeading: 'LIÇÃO PRINCIPAL:',
    subscribeCta: 'Inscreva-se para novos episódios semanais de folclore mundial animado e análise cultural.',
    kidsCta: 'Assista a mais fábulas clássicas ilustradas no nosso canal.',
    pinnedCommentPrompt: (lead, rival) =>
      `O que VOCÊ teria feito no lugar de ${lead} diante de ${rival}? Comente abaixo qual lenda clássica devemos animar a seguir!`,
    attributionFooter: (series) =>
      `SOBRE ESTA ADAPTAÇÃO (OBRA TRANSFORMATIVA ORIGINAL):\nInspirada no folclore tradicional de domínio público (${series}), com roteiro dramatizado original, animação 2D personalizada, trilha regional e comentário cultural.`,
    culturalContextLine: (series, lead) =>
      `Preservada há séculos na tradição de ${series}, esta narrativa sobre ${lead} continua atual por mostrar como a lucidez supera a força bruta.`,
  },
  {
    code: 'fr',
    label: 'French',
    nativeName: 'Français',
    bcp47: 'fr-FR',
    dir: 'ltr',
    scriptType: 'latin',
    fontFamily: LATIN_SANS,
    displayFontFamily: LATIN_DISPLAY,
    voiceHint: 'Literary French Conte storytelling tone',
    storyWithinStory: 'RÉCIT DANS LE RÉCIT',
    moralHeader: 'MORALE DU CONTE',
    culturalNoteTitle: 'Contexte Culturel et Réflexion Moderne',
    culturalNoteLabel: 'Conteur · Note Culturelle',
    thumbnailFallback: 'LE CONTE OUBLIÉ',
    chaptersHeading: 'CHAPITRES :',
    keyTakeawayHeading: 'LEÇON ESSENTIELLE :',
    subscribeCta: 'Abonnez-vous pour découvrir chaque semaine de nouveaux contes animés du monde entier et leur analyse culturelle.',
    kidsCta: 'Découvrez d’autres fables classiques illustrées sur notre chaîne.',
    pinnedCommentPrompt: (lead, rival) =>
      `Qu’auriez-vous fait à la place de ${lead} face à ${rival} ? Partagez votre avis en commentaire !`,
    attributionFooter: (series) =>
      `À PROPOS DE CETTE ADAPTATION (ŒUVRE TRANSFORMATIVE ORIGINALE) :\nInspirée du folklore traditionnel du domaine public (${series}), avec scénario original, mise en scène 2D, musique régionale et commentaire culturel.`,
    culturalContextLine: (series, lead) =>
      `Transmis de génération en génération dans la tradition de ${series}, ce récit autour de ${lead} résonne encore aujourd’hui par sa finesse psychologique.`,
  },
  {
    code: 'de',
    label: 'German',
    nativeName: 'Deutsch',
    bcp47: 'de-DE',
    dir: 'ltr',
    scriptType: 'latin',
    fontFamily: LATIN_SANS,
    displayFontFamily: LATIN_DISPLAY,
    voiceHint: 'Atmospheric German Märchen documentary tone',
    storyWithinStory: 'GESCHICHTE IN DER GESCHICHTE',
    moralHeader: 'MORAL DER GESCHICHTE',
    culturalNoteTitle: 'Kultureller Kontext & Moderne Deutung',
    culturalNoteLabel: 'Erzähler · Kulturkommentar',
    thumbnailFallback: 'DIE VERBORGENE SAGE',
    chaptersHeading: 'KAPITEL:',
    keyTakeawayHeading: 'KERNGEDANKE:',
    subscribeCta: 'Abonniere für wöchentliche animierte Weltmärchen, Mythen und kulturelle Analysen.',
    kidsCta: 'Entdecke weitere klassische illustrierte Fabeln auf unserem Kanal.',
    pinnedCommentPrompt: (lead, rival) =>
      `Wie hättest DU anstelle von ${lead} gegen ${rival} gehandelt? Schreib es in die Kommentare!`,
    attributionFooter: (series) =>
      `ÜBER DIESE ADAPTION (EIGENSTÄNDIGE BEARBEITUNG):\nInspiriert von gemeinfreier Folklore (${series}), umgesetzt mit eigenem Drehbuch, 2D-Inszenierung, regionaler Musik und kultureller Einordnung.`,
    culturalContextLine: (series, lead) =>
      `Über Jahrhunderte in der Tradition von ${series} überliefert, zeigt diese Geschichte von ${lead} bis heute, wie Klugheit selbst unter Druck Bestand hat.`,
  },
  {
    code: 'id',
    label: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    bcp47: 'id-ID',
    dir: 'ltr',
    scriptType: 'latin',
    fontFamily: LATIN_SANS,
    displayFontFamily: LATIN_DISPLAY,
    voiceHint: 'Classical Nusantara Dalang storyteller cadence',
    storyWithinStory: 'KISAH DI DALAM KISAH',
    moralHeader: 'PESAN MORAL',
    culturalNoteTitle: 'Konteks Budaya & Refleksi Masa Kini',
    culturalNoteLabel: 'Pencerita · Catatan Budaya',
    thumbnailFallback: 'KISAH TERSEMBUNYI',
    chaptersHeading: 'BABAK:',
    keyTakeawayHeading: 'PELAJARAN UTAMA:',
    subscribeCta: 'Berlangganan untuk kisah rakyat animasi Nusantara & Dunia terbaru setiap minggu.',
    kidsCta: 'Tonton lebih banyak fabel klasik berilustrasi di kanal kami.',
    pinnedCommentPrompt: (lead, rival) =>
      `Apa yang akan KAMU lakukan di posisi ${lead} menghadapi ${rival}? Tulis pendapatmu di kolom komentar!`,
    attributionFooter: (series) =>
      `TENTANG ADAPTASI INI (KARYA TRANSFORMATIF ORISINAL):\nTerinspirasi dari cerita rakyat domain publik (${series}), dilengkapi naskah drama orisinal, animasi 2D, musik daerah, dan ulasan budaya.`,
    culturalContextLine: (series, lead) =>
      `Diwariskan turun-temurun dalam tradisi ${series}, kisah ${lead} ini tetap relevan hingga hari ini karena menyingkap kecerdikan di tengah tekanan.`,
  },
  {
    code: 'ja',
    label: 'Japanese',
    nativeName: '日本語',
    bcp47: 'ja-JP',
    dir: 'ltr',
    scriptType: 'cjk',
    fontFamily: `"Noto Sans JP", ${LATIN_SANS}`,
    displayFontFamily: `"Noto Sans JP", ${LATIN_SANS}`,
    voiceHint: 'Calm Kamishibai folktale narration in natural Japanese',
    storyWithinStory: '物語の中の物語',
    moralHeader: '物語の教訓',
    culturalNoteTitle: '文化的背景と現代への学び',
    culturalNoteLabel: '語り手・文化解説',
    thumbnailFallback: '語り継がれる伝承',
    chaptersHeading: 'チャプター:',
    keyTakeawayHeading: '今回の教訓:',
    subscribeCta: 'チャンネル登録で、毎週新作の世界の民話アニメーションと文化解説をお届けします。',
    kidsCta: 'チャンネルで他の名作民話アニメーションもご覧ください。',
    pinnedCommentPrompt: (lead, rival) =>
      `もしあなたが${rival}を前にした${lead}の立場ならどうしますか？ぜひコメントで教えてください！`,
    attributionFooter: (series) =>
      `この作品について（オリジナル翻案）:\nパブリックドメインの伝統民話（${series}）を原案に、独自の脚本、2Dアニメーション演出、地域音楽、文化解説を加えて制作しています。`,
    culturalContextLine: (series, lead) =>
      `${series}の口承文化として語り継がれてきた${lead}の物語は、困難な状況で冷静な判断力がどれほど大切かを現代の私たちにも教えてくれます。`,
  },
  {
    code: 'ko',
    label: 'Korean',
    nativeName: '한국어',
    bcp47: 'ko-KR',
    dir: 'ltr',
    scriptType: 'hangul',
    fontFamily: `"Noto Sans KR", ${LATIN_SANS}`,
    displayFontFamily: `"Noto Sans KR", ${LATIN_SANS}`,
    voiceHint: 'Warm Korean folk documentary storytelling tone',
    storyWithinStory: '이야기 속의 이야기',
    moralHeader: '이야기의 교훈',
    culturalNoteTitle: '문화적 배경과 오늘의 통찰',
    culturalNoteLabel: '해설자 · 문화 노트',
    thumbnailFallback: '숨겨진 옛이야기',
    chaptersHeading: '챕터:',
    keyTakeawayHeading: '핵심 교훈:',
    subscribeCta: '매주 공개되는 세계 전래동화 애니메이션과 문화 해설을 구독해 보세요.',
    kidsCta: '채널에서 더 많은 고전 설화 애니메이션을 만나보세요.',
    pinnedCommentPrompt: (lead, rival) =>
      `${rival} 앞에서 여러분이 ${lead}이었다면 어떻게 행동했을까요? 댓글로 생각을 들려주세요!`,
    attributionFooter: (series) =>
      `작품 안내 (창작 각색 콘텐츠):\n전통 구전 설화(${series})를 바탕으로 독창적인 대본, 2D 애니메이션 연출, 전통 선율, 문화 해설을 더해 제작했습니다.`,
    culturalContextLine: (series, lead) =>
      `${series} 구전 전통 속에서 이어져 온 ${lead}의 이야기는 위기 속에서 지혜와 침착함이 어떤 힘을 발휘하는지 오늘날에도 생생히 보여 줍니다.`,
  },
  {
    code: 'zh',
    label: 'Chinese',
    nativeName: '中文',
    bcp47: 'zh-CN',
    dir: 'ltr',
    scriptType: 'cjk',
    fontFamily: `"Noto Sans SC", "Noto Sans JP", ${LATIN_SANS}`,
    displayFontFamily: `"Noto Sans SC", "Noto Sans JP", ${LATIN_SANS}`,
    voiceHint: 'Refined classical Pingshu storytelling cadence in Mandarin',
    storyWithinStory: '画中故事',
    moralHeader: '故事寓意',
    culturalNoteTitle: '文化背景与当代启示',
    culturalNoteLabel: '说书人 · 文化解读',
    thumbnailFallback: '经典传说',
    chaptersHeading: '章节目录:',
    keyTakeawayHeading: '核心启示:',
    subscribeCta: '欢迎订阅，每周更新世界经典神话民间故事动画与文化解读。',
    kidsCta: '欢迎在频道观看更多经典绘本风格寓言动画。',
    pinnedCommentPrompt: (lead, rival) =>
      `如果面对${rival}的人是你而不是${lead}，你会怎么做？欢迎在评论区分享你的想法！`,
    attributionFooter: (series) =>
      `关于本集改编（原创二创作品）：\n取材自公版传统民间故事（${series}），由本频道原创剧本编排、2D动画分镜、地域配乐与文化解说制作而成。`,
    culturalContextLine: (series, lead) =>
      `在${series}世代口耳相传的传统里，${lead}的这段经历至今依然发人深省：真正的智慧往往在危机时刻显现。`,
  },
  {
    code: 'ar',
    label: 'Arabic',
    nativeName: 'العربية',
    bcp47: 'ar-SA',
    dir: 'rtl',
    scriptType: 'arabic',
    fontFamily: `"Noto Sans Arabic", ${LATIN_SANS}`,
    displayFontFamily: `"Noto Sans Arabic", ${LATIN_SANS}`,
    voiceHint: 'Eloquent Hakawati classical Arabic storytelling cadence',
    storyWithinStory: 'حكاية داخل حكاية',
    moralHeader: 'العبرة من الحكاية',
    culturalNoteTitle: 'السياق الثقافي وتأمل معاصر',
    culturalNoteLabel: 'الحكواتي · إضاءة ثقافية',
    thumbnailFallback: 'حكاية خالدة',
    chaptersHeading: 'الفصول:',
    keyTakeawayHeading: 'الخلاصة:',
    subscribeCta: 'اشترك معنا لحلقات أسبوعية من حكايات التراث العالمي المتحركة والتحليل الثقافي.',
    kidsCta: 'استكشف المزيد من الحكايات التراثية المصورة على قناتنا.',
    pinnedCommentPrompt: (lead, rival) =>
      `لو كنت مكان ${lead} أمام ${rival}، ماذا كنت ستفعل؟ شاركنا رأيك في التعليقات!`,
    attributionFooter: (series) =>
      `حول هذا العمل (معالجة إبداعية أصلية):\nمستلهم من التراث الشعبي العام (${series})، مع سيناريو درامي أصلي وإخراج رسوم متحركة ثنائية الأبعاد وموسيقى تقليدية وتعليق ثقافي.`,
    culturalContextLine: (series, lead) =>
      `تظل حكاية ${lead} في تراث ${series} حيّة حتى اليوم لأنها تكشف كيف تصمد الحكمة وسرعة البديهة في أصعب المواقف.`,
  },
];

const LANGUAGE_MAP = new Map<string, LanguageSpec>(
  LANGUAGE_CATALOG.map((spec) => [spec.code, spec])
);

export function getLanguageSpec(code?: string | null): LanguageSpec {
  const norm = String(code || '')
    .trim()
    .toLowerCase()
    .split(/[-_]/)[0];
  return LANGUAGE_MAP.get(norm) || LANGUAGE_CATALOG[0];
}

export function isValidLanguageCode(code: unknown): code is LanguageCode {
  return typeof code === 'string' && LANGUAGE_MAP.has(code.trim().toLowerCase());
}

/**
 * Automatically detects the primary writing script/language from text when
 * `episode.language` is unset (e.g., user pasted Hindi/Japanese/Arabic JSON).
 */
export function detectLanguageFromText(text: string): LanguageCode {
  const s = String(text || '');
  if (!s.trim()) return 'en';
  if (/[\u0900-\u097F]/.test(s)) return 'hi'; // Devanagari
  if (/[\u0B80-\u0BFF]/.test(s)) return 'ta'; // Tamil
  if (/[\u0C00-\u0C7F]/.test(s)) return 'te'; // Telugu
  if (/[\u0980-\u09FF]/.test(s)) return 'bn'; // Bengali
  if (/[\u0A80-\u0AFF]/.test(s)) return 'gu'; // Gujarati
  if (/[\u0C80-\u0CFF]/.test(s)) return 'kn'; // Kannada
  if (/[\u0D00-\u0D7F]/.test(s)) return 'ml'; // Malayalam
  if (/[\u0600-\u06FF]/.test(s)) {
    // Distinguish Urdu-specific Nastaliq letters from Arabic
    return /[ٹڈڑںےپچژگ]/.test(s) ? 'ur' : 'ar';
  }
  if (/[\u3040-\u30FF]/.test(s)) return 'ja'; // Hiragana / Katakana
  if (/[\uAC00-\uD7AF]/.test(s)) return 'ko'; // Hangul
  if (/[\u4E00-\u9FFF]/.test(s)) return 'zh'; // Han ideographs without Kana
  return 'en';
}

export function resolveEpisodeLanguage(
  episode: Partial<Pick<EpisodeScript, 'language' | 'title' | 'beats'>>
): LanguageSpec {
  if (episode.language && isValidLanguageCode(episode.language)) {
    return getLanguageSpec(episode.language);
  }
  const sample = [
    episode.title || '',
    ...(episode.beats || []).slice(0, 3).map((b) => b.dialogue || ''),
  ].join(' ');
  return getLanguageSpec(detectLanguageFromText(sample));
}

export function isRtlText(text: string, langCode?: string): boolean {
  if (langCode && getLanguageSpec(langCode).dir === 'rtl') return true;
  return /[\u0590-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

/** Uppercases Latin text only so Indic/Arabic/CJK glyphs and diacritics remain intact. */
export function safeUppercase(text: string, lang: LanguageSpec): string {
  if (!text) return '';
  return lang.scriptType === 'latin' ? text.toUpperCase() : text;
}

/**
 * Counts spoken "word equivalents" accurately across BOTH space-delimited scripts
 * (English, Hindi, Tamil, Arabic, Spanish, Korean) AND space-free CJK (Japanese, Chinese).
 */
export function countMultilingualSpokenUnits(text: string): number {
  const clean = String(text || '').trim();
  if (!clean) return 0;

  // Extract CJK characters (Japanese Kana/Kanji & Chinese Hanzi)
  const cjkMatches = clean.match(/[\u3040-\u30FF\u3400-\u9FFF]/g);
  const cjkCount = cjkMatches ? cjkMatches.length : 0;

  // Remaining space-delimited words
  const nonCjk = clean
    .replace(/[\u3040-\u30FF\u3400-\u9FFF]/g, ' ')
    .replace(/[।。、！？،؟.,!?;:"'“”‘’()[\]—–-]+/g, ' ')
    .trim();
  const spaceWords = nonCjk ? nonCjk.split(/\s+/).filter(Boolean).length : 0;

  // ~2.3 CJK characters ≈ 1 spoken English word at calm storytelling cadence
  return Math.round(spaceWords + cjkCount / 2.3);
}

export function estimateMultilingualDuration(dialogue: string, frame: FrameMode = 'main'): number {
  if (frame === 'chapter_title') return 2.8;
  const units = countMultilingualSpokenUnits(dialogue);
  if (units === 0) return 3.0;
  const base = units / 2.55 + 1.05;
  const maxDur = frame === 'moral_card' ? 6.8 : 8.5;
  return Number(Math.max(2.6, Math.min(maxDur, base)).toFixed(1));
}

export function buildLanguageDirectorInstruction(lang: LanguageSpec): string {
  if (lang.code === 'en') {
    return 'LANGUAGE: Write all human-readable story text (title, subtitle, series, speakerLabel, beat titles, dialogue, and cast names) in crisp, vivid English.';
  }
  return [
    `TARGET STORY LANGUAGE: ${lang.label} (${lang.nativeName} · code "${lang.code}").`,
    `- Write ALL human-readable fields ("title", "subtitle", "series", "cast[].name", "beat.title", "speakerLabel", "dialogue", and optional "reason") natively in natural, literary ${lang.label} (${lang.nativeName}) with ${lang.voiceHint}.`,
    `- Set root field "language": "${lang.code}".`,
    `- CRITICAL SCHEMA LOCK: Keep ALL JSON property keys and engine enum IDs ("archetype", "stage", "prop", "mood", "raag", "expression", "shot", "frame", "cast[].id", "speakerId") in EXACT lowercase ASCII English tokens from the menu! Never translate enum IDs.`,
    `- Keep dialogue crisp (equivalent to 10–18 spoken words per scene) so captions fit cleanly on screen.`,
  ].join('\n');
}
