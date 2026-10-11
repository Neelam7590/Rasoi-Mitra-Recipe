import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  getHealthCheckQueryKey,
  useCreateRasoiMitraReply,
  useCreateRasoiMitraSpeech,
  useHealthCheck,
} from "@workspace/api-client-react";
import type {
  RasoiMitraChatInput,
  RasoiMitraPreferencesDietaryFiltersItem,
  RasoiMitraPreferencesMealType,
} from "@workspace/api-client-react";
import {
  ArrowDown,
  ArrowLeft,
  AudioLines,
  Bookmark,
  Check,
  ChefHat,
  ChevronDown,
  CircleHelp,
  Clock3,
  Copy,
  Flame,
  Heart,
  Languages,
  Leaf,
  Menu,
  Mic,
  Moon,
  Plus,
  Send,
  Settings2,
  Sparkles,
  Sun,
  Utensils,
  Volume2,
  X,
} from "lucide-react";
import { Link, Route, Switch, useLocation, Router as WouterRouter } from "wouter";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

type Message = { id: string; conversationId: string; role: "user" | "assistant"; content: string; createdAt: string };
type Conversation = { id: string; title: string; createdAt: string; updatedAt: string; messages: Message[] };
type Favorite = { messageId: string; conversationId: string; content: string; savedAt: string };
type UiLanguage = "en" | "hi";
type Theme = "light" | "dark";
type Preferences = {
  dietaryFilters: RasoiMitraPreferencesDietaryFiltersItem[];
  mealType: RasoiMitraPreferencesMealType;
  servings: number;
  useLeftovers: boolean;
};

const queryClient = new QueryClient();
const STORAGE = {
  favorites: "rasoi-mitra-favorites-v1",
  language: "rasoi-mitra-language-v1",
  theme: "rasoi-mitra-theme-v1",
  preferences: "rasoi-mitra-preferences-v1",
};

const copy = {
  en: {
    kitchen: "YOUR EVERYDAY KITCHEN COMPANION",
    newChat: "New conversation",
    favorites: "Saved recipes",
    help: "A little help, whenever you need it.",
    subtitle: "Recipes, cooking know-how & everyday nutrition — made for your kitchen.",
    welcome: "What are we cooking today?",
    welcomeBody: "Tell me what’s in your kitchen, what you’re craving, or what you’d like to eat a little better.",
    quick: "A good place to start",
    quicks: ["A 10-minute dinner with what I have", "A healthy breakfast to start the day", "Ideas for my child’s tiffin", "What can I make with leftovers?", "A weight-loss friendly Indian dinner"],
    placeholder: "Ask about a recipe, an ingredient, or a healthier habit…",
    hint: "RasoiMitra can make mistakes. Trust your taste, and check important nutrition advice.",
    preferences: "Cooking preferences",
    diet: "A little about how you eat",
    vegetarian: "Vegetarian",
    low_oil: "Less oil",
    high_protein: "High protein",
    weight_loss: "Weight mindful",
    meal: "Meal",
    servings: "Serves",
    leftovers: "Use leftovers",
    breakfast: "Breakfast",
    lunch: "Lunch",
    dinner: "Dinner",
    snack: "Snack",
    anyMeal: "Any meal",
    language: "Language",
    light: "Light",
    dark: "Dark",
    connection: "Kitchen connection",
    connected: "Ready to help",
    connecting: "Checking…",
    needsKey: "Add OPENAI_API_KEY in Replit Secrets to enable AI replies",
    unavailable: "Service unavailable",
    start: "Start a conversation",
    savedTitle: "Recipes worth keeping",
    savedIntro: "Your most-loved answers, gathered in one place.",
    noSaved: "Nothing saved just yet",
    noSavedBody: "When an answer feels just right, save it and it’ll be waiting here.",
    backToChat: "Back to cooking",
    remove: "Remove",
    save: "Save recipe",
    saved: "Saved",
    read: "Read aloud",
    stop: "Stop reading",
    listening: "Listening…",
    micUnsupported: "Voice input isn’t supported in this browser. Try a recent version of Chrome or Edge.",
    microphoneError: "Microphone access wasn’t available. You can still type your question.",
    replyError: "I couldn’t reach the kitchen just now. Please try again in a moment.",
    keyError: "AI replies are not configured yet. Add OPENAI_API_KEY in Replit Secrets, then try again.",
    speechError: "I couldn’t prepare audio for this reply. Please try again.",
    menu: "Open menu",
    servingLabel: "portions",
    message: "Message",
    speaking: "Preparing audio…",
    preferencesButton: "Preferences",
    conversation: "Conversation",
    loaded: "Conversation opened",
    newConversation: "A fresh page in the kitchen",
    close: "Close",
  },
  hi: {
    kitchen: "आपका रोज़ का रसोई साथी",
    newChat: "नई बातचीत",
    favorites: "सहेजी रेसिपी",
    help: "जब चाहें, थोड़ी मदद।",
    subtitle: "रेसिपी, खाना पकाने के सुझाव और पोषण — आपकी रसोई के लिए।",
    welcome: "आज क्या पकाएँ?",
    welcomeBody: "बताइए रसोई में क्या है, क्या खाने का मन है, या किस आदत को थोड़ा बेहतर बनाना चाहते हैं।",
    quick: "यहाँ से शुरुआत करें",
    quicks: ["घर की चीज़ों से 10 मिनट का खाना", "दिन की शुरुआत के लिए पौष्टिक नाश्ता", "बच्चों के टिफ़िन के लिए सुझाव", "बचे हुए खाने से क्या बनाएँ?", "वज़न घटाने के लिए भारतीय डिनर"],
    placeholder: "रेसिपी, सामग्री या सेहतमंद आदत के बारे में पूछें…",
    hint: "RasoiMitra से गलती हो सकती है। अपने स्वाद पर भरोसा करें और ज़रूरी पोषण सलाह जाँच लें।",
    preferences: "खाना पकाने की पसंद",
    diet: "आपका खाने का तरीका",
    vegetarian: "शाकाहारी",
    low_oil: "कम तेल",
    high_protein: "ज़्यादा प्रोटीन",
    weight_loss: "वज़न का ध्यान",
    meal: "भोजन",
    servings: "कितने लोगों के लिए",
    leftovers: "बचा हुआ खाना इस्तेमाल करें",
    breakfast: "नाश्ता",
    lunch: "दोपहर",
    dinner: "रात",
    snack: "स्नैक",
    anyMeal: "कोई भी",
    language: "भाषा",
    light: "हल्की",
    dark: "गहरी",
    connection: "रसोई से कनेक्शन",
    connected: "मदद के लिए तैयार",
    connecting: "जाँच रहे हैं…",
    needsKey: "AI जवाब चालू करने के लिए Replit Secrets में OPENAI_API_KEY जोड़ें",
    unavailable: "सेवा उपलब्ध नहीं",
    start: "बातचीत शुरू करें",
    savedTitle: "पसंदीदा रेसिपी",
    savedIntro: "आपके पसंदीदा जवाब, सब एक जगह।",
    noSaved: "अभी कुछ सहेजा नहीं है",
    noSavedBody: "कोई जवाब पसंद आए, तो उसे सहेजें। वह यहीं मिल जाएगा।",
    backToChat: "खाना पकाने पर लौटें",
    remove: "हटाएँ",
    save: "रेसिपी सहेजें",
    saved: "सहेजी गई",
    read: "सुनें",
    stop: "सुनना रोकें",
    listening: "सुन रहे हैं…",
    micUnsupported: "इस ब्राउज़र में आवाज़ से लिखना संभव नहीं है। Chrome या Edge का नया संस्करण आज़माएँ।",
    microphoneError: "माइक्रोफ़ोन उपलब्ध नहीं है। आप अपना सवाल लिख सकते हैं।",
    replyError: "अभी रसोई से संपर्क नहीं हो पाया। कृपया थोड़ी देर में फिर कोशिश करें।",
    keyError: "AI जवाब अभी चालू नहीं हैं। Replit Secrets में OPENAI_API_KEY जोड़ें, फिर दोबारा कोशिश करें।",
    speechError: "इस जवाब का ऑडियो तैयार नहीं हो पाया। फिर कोशिश करें।",
    menu: "मेन्यू खोलें",
    servingLabel: "लोग",
    message: "संदेश",
    speaking: "ऑडियो तैयार हो रहा है…",
    preferencesButton: "पसंद",
    conversation: "बातचीत",
    loaded: "बातचीत खुली",
    newConversation: "रसोई का नया पन्ना",
    close: "बंद करें",
  },
} as const;

const quickPrompts = [
  { icon: Clock3, kind: "quick-ten-minute" },
  { icon: Leaf, kind: "quick-breakfast" },
  { icon: Utensils, kind: "quick-tiffin" },
  { icon: Flame, kind: "quick-leftovers" },
  { icon: Heart, kind: "quick-weight-loss" },
] as const;

function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function friendlyError(error: unknown, language: UiLanguage) {
  const text = error instanceof Error ? error.message : String(error ?? "");
  const missingKey = /api.?key|server key|not configured|missing.*key|401|403/i.test(text);
  return missingKey ? copy[language].keyError : copy[language].replyError;
}

function App() {
  const [location, setLocation] = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>(() => readStorage(STORAGE.favorites, []));
  const [language, setLanguage] = useState<UiLanguage>(() => readStorage(STORAGE.language, "en"));
  const [theme, setTheme] = useState<Theme>(() => readStorage(STORAGE.theme, "light"));
  const [preferences, setPreferences] = useState<Preferences>(() =>
    readStorage(STORAGE.preferences, { dietaryFilters: [], mealType: "unspecified", servings: 2, useLeftovers: false }),
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPrefsOpen, setIsPrefsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [replyError, setReplyError] = useState("");
  const [speechErrorId, setSpeechErrorId] = useState<string | null>(null);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [scrolledAway, setScrolledAway] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const speechSequenceRef = useRef(0);
  const replyMutation = useCreateRasoiMitraReply();
  const speechMutation = useCreateRasoiMitraSpeech();
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), refetchInterval: 45000 } });
  const t = copy[language];
  const activeConversation = conversations.find((conversation) => conversation.id === activeId) ?? null;
  const isFavoritesPage = location === "/favorites";
  const visibleFavorites = useMemo(
    () => [...favorites].sort((a, b) => b.savedAt.localeCompare(a.savedAt)),
    [favorites],
  );

  useEffect(() => {
    localStorage.setItem(STORAGE.favorites, JSON.stringify(favorites));
  }, [favorites]);
  useEffect(() => {
    localStorage.setItem(STORAGE.language, JSON.stringify(language));
  }, [language]);
  useEffect(() => {
    localStorage.setItem(STORAGE.theme, JSON.stringify(theme));
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
  useEffect(() => {
    localStorage.setItem(STORAGE.preferences, JSON.stringify(preferences));
  }, [preferences]);
  useEffect(() => {
    if (activeId && !activeConversation) setActiveId(null);
  }, [activeId, activeConversation]);
  useEffect(() => {
    if (!isFavoritesPage && activeConversation) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [activeConversation?.messages.length, isFavoritesPage, replyMutation.isPending]);
  useEffect(() => () => {
    audioRef.current?.pause();
    if (recognitionRef.current) recognitionRef.current.abort();
  }, []);

  function createConversation() {
    setConversations([]);
    setActiveId(null);
    setDraft("");
    setReplyError("");
    setVoiceError("");
    setLocation("/");
    setIsMenuOpen(false);
  }

  function toggleFavorite(message: Message) {
    setFavorites((items) => {
      const found = items.some((item) => item.messageId === message.id);
      if (found) return items.filter((item) => item.messageId !== message.id);
      return [...items, { messageId: message.id, conversationId: message.conversationId, content: message.content, savedAt: new Date().toISOString() }];
    });
  }

  function removeFavorite(messageId: string) {
    setFavorites((items) => items.filter((item) => item.messageId !== messageId));
  }

  async function sendMessage(value = draft, retry = false) {
    const message = value.trim();
    if (!message || replyMutation.isPending) return;
    setDraft("");
    setReplyError("");
    setVoiceError("");

    const now = new Date().toISOString();
    const conversationId = activeConversation?.id ?? makeId();
    const userMessage: Message = {
      id: makeId(),
      conversationId,
      role: "user",
      content: message,
      createdAt: now,
    };
    const retryBase = retry && activeConversation
      ? { ...activeConversation, messages: activeConversation.messages.slice(0, -1) }
      : activeConversation;
    const initialConversation: Conversation = retryBase ?? {
      id: conversationId,
      title: message.length > 46 ? `${message.slice(0, 43).trim()}…` : message,
      createdAt: now,
      updatedAt: now,
      messages: [],
    };
    const updatedConversation: Conversation = {
      ...initialConversation,
      updatedAt: now,
      messages: [...initialConversation.messages, userMessage],
    };
    setConversations((items) => [updatedConversation, ...items.filter((item) => item.id !== conversationId)]);
    setActiveId(conversationId);
    setLocation("/");

    const history = initialConversation.messages.slice(-16).map(({ role, content }) => ({ role, content }));
    const payload: RasoiMitraChatInput = {
      message,
      history,
      languageHint: language === "hi" ? "hi-IN" : "en-IN",
      preferences: {
        dietaryFilters: preferences.dietaryFilters,
        mealType: preferences.mealType,
        servings: preferences.servings,
        useLeftovers: preferences.useLeftovers,
      },
    };

    try {
      const response = await replyMutation.mutateAsync({ data: payload });
      const assistantMessage: Message = {
        id: makeId(),
        conversationId,
        role: "assistant",
        content: response.reply,
        createdAt: new Date().toISOString(),
      };
      setConversations((items) =>
        items.map((item) => item.id === conversationId
          ? { ...item, updatedAt: assistantMessage.createdAt, messages: [...item.messages, assistantMessage] }
          : item),
      );
    } catch (error) {
      setReplyError(friendlyError(error, language));
    }
  }

  function startVoiceInput() {
    setVoiceError("");
    const speechWindow = window as typeof window & { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any };
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceError(t.micUnsupported);
      return;
    }
    try {
      const recognition = new Recognition();
      recognition.lang = language === "hi" ? "hi-IN" : "en-IN";
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) setDraft((current) => [current.trim(), transcript].filter(Boolean).join(" "));
      };
      recognition.onerror = () => {
        setVoiceError(t.microphoneError);
        setIsListening(false);
      };
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceError(t.microphoneError);
    }
  }

  function stopVoiceInput() {
    recognitionRef.current?.stop();
    setIsListening(false);
  }

  async function readAloud(message: Message) {
    setSpeechErrorId(null);
    if (playingMessageId === message.id || speakingMessageId === message.id) {
      speechSequenceRef.current += 1;
      audioRef.current?.pause();
      audioRef.current = null;
      setPlayingMessageId(null);
      setSpeakingMessageId(null);
      return;
    }
    audioRef.current?.pause();
    audioRef.current = null;
    setPlayingMessageId(null);
    const sequence = ++speechSequenceRef.current;
    setSpeakingMessageId(message.id);
    try {
      const speech = await speechMutation.mutateAsync({
        data: { text: message.content, language: language === "hi" ? "hi-IN" : "en-IN" },
      });
      if (sequence !== speechSequenceRef.current) return;
      const audio = new Audio(`data:${speech.contentType};base64,${speech.audioBase64}`);
      audioRef.current = audio;
      audio.onended = () => {
        setPlayingMessageId(null);
        setSpeakingMessageId(null);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setPlayingMessageId(null);
        setSpeakingMessageId(null);
        setSpeechErrorId(message.id);
        audioRef.current = null;
      };
      await audio.play();
      if (sequence !== speechSequenceRef.current) {
        audio.pause();
        return;
      }
      setPlayingMessageId(message.id);
      setSpeakingMessageId(null);
    } catch {
      setSpeakingMessageId(null);
      setSpeechErrorId(message.id);
    }
  }

  function toggleDietFilter(filter: RasoiMitraPreferencesDietaryFiltersItem) {
    setPreferences((current) => ({
      ...current,
      dietaryFilters: current.dietaryFilters.includes(filter)
        ? current.dietaryFilters.filter((item) => item !== filter)
        : [...current.dietaryFilters, filter],
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  const healthStatus = health.isLoading
    ? "loading"
    : health.isError
      ? "offline"
      : health.data?.status === "needs_openai_key"
        ? "needs-key"
        : "online";

  function AppShell() {
    return (
      <div className="grain app-shell flex h-[100dvh] overflow-hidden bg-background text-foreground">
        {isMenuOpen && <button type="button" aria-label={t.close} data-testid="button-close-mobile-menu" className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-[2px] md:hidden" onClick={() => setIsMenuOpen(false)} />}
        <aside className={`fixed inset-y-0 left-0 z-50 flex w-[286px] flex-col border-r border-border bg-sidebar transition-transform duration-300 md:static md:z-auto md:translate-x-0 ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-center justify-between px-5 pb-6 pt-6">
            <Link href="/" onClick={createConversation} data-testid="link-brand-home" className="flex items-center gap-3 no-underline">
              <span className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-primary text-primary-foreground shadow-[0_5px_15px_hsl(var(--primary)/.2)]"><ChefHat size={24} strokeWidth={1.8} /></span>
              <span>
                <span className="block font-display text-[22px] font-semibold tracking-tight text-foreground">RasoiMitra</span>
                <span className="mt-0.5 block text-[9px] font-bold tracking-[.14em] text-muted-foreground">{t.kitchen}</span>
              </span>
            </Link>
            <button type="button" data-testid="button-close-sidebar" className="rounded-lg p-2 text-muted-foreground hover:bg-accent md:hidden" onClick={() => setIsMenuOpen(false)} aria-label={t.close}><X size={18} /></button>
          </div>

          <div className="px-4">
            <button type="button" onClick={createConversation} data-testid="button-new-conversation" className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[13px] font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <Plus size={17} /> {t.newChat}
            </button>
            <Link href="/favorites" onClick={() => { setLocation("/favorites"); setIsMenuOpen(false); }} data-testid="link-favorites" className={`mt-2.5 flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-semibold no-underline transition ${isFavoritesPage ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"}`}>
              <Bookmark size={17} /> <span className="flex-1">{t.favorites}</span>
              <span className="rounded-full bg-background/80 px-2 py-0.5 text-[10px] text-muted-foreground" data-testid="text-favorite-count">{favorites.length}</span>
            </Link>
          </div>

          <div className="flex-1" />

          <div className="m-4 rounded-2xl border border-border/80 bg-background/70 p-4">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${healthStatus === "online" ? "bg-emerald-600" : healthStatus === "loading" || healthStatus === "needs-key" ? "bg-amber-500" : "bg-destructive"}`} />
              <span className="text-[11px] font-semibold">{t.connection}</span>
            </div>
            <p data-testid="status-service-health" className="mt-1.5 pl-4 text-[10px] text-muted-foreground">
              {healthStatus === "loading" ? t.connecting : healthStatus === "online" ? t.connected : healthStatus === "needs-key" ? t.needsKey : t.unavailable}
            </p>
          </div>
          <div className="flex items-center gap-3 border-t border-border/70 px-5 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground"><Leaf size={17} /></div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold">Made for your home</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{t.help}</p>
            </div>
            <button type="button" aria-label={t.preferencesButton} data-testid="button-open-preferences-sidebar" onClick={() => setIsPrefsOpen(true)} className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"><Settings2 size={17} /></button>
          </div>
        </aside>

        <main className="relative flex h-[100dvh] min-h-0 min-w-0 flex-1 flex-col">
          <header className="z-10 flex h-[68px] shrink-0 items-center justify-between border-b border-border/70 bg-background/85 px-4 backdrop-blur-md md:px-8">
            <div className="flex items-center gap-3">
              <button type="button" aria-label={t.menu} data-testid="button-open-mobile-menu" onClick={() => setIsMenuOpen(true)} className="rounded-xl p-2 text-muted-foreground hover:bg-accent md:hidden"><Menu size={20} /></button>
              <div>
                <p className="text-[12px] font-semibold">{isFavoritesPage ? t.favorites : activeConversation?.title ?? t.conversation}</p>
                <p data-testid="text-header-subtitle" className="mt-0.5 text-[10px] text-muted-foreground">{isFavoritesPage ? t.savedIntro : t.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden items-center rounded-full border border-border bg-card p-1 sm:flex">
                <button type="button" data-testid="button-language-en" onClick={() => setLanguage("en")} className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition ${language === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>EN</button>
                <button type="button" data-testid="button-language-hi" onClick={() => setLanguage("hi")} className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition ${language === "hi" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>हि</button>
              </div>
              <button type="button" aria-label={language === "en" ? "Change language" : "भाषा बदलें"} data-testid="button-language-mobile" onClick={() => setLanguage((current) => current === "en" ? "hi" : "en")} className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground sm:hidden"><Languages size={16} /></button>
              <button type="button" aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"} data-testid="button-toggle-theme" onClick={() => setTheme((current) => current === "light" ? "dark" : "light")} className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:border-primary/40 hover:text-primary">{theme === "light" ? <Moon size={16} /> : <Sun size={16} />}</button>
              <button type="button" aria-label={t.preferencesButton} data-testid="button-open-preferences" onClick={() => setIsPrefsOpen(true)} className="flex h-9 items-center gap-2 rounded-full border border-border bg-card px-3 text-[11px] font-semibold text-muted-foreground transition hover:text-foreground"><Settings2 size={15} /><span className="hidden sm:inline">{t.preferencesButton}</span></button>
            </div>
          </header>

          <Switch>
            <Route path="/favorites">
              <FavoritesPage favorites={visibleFavorites} language={language} onRemove={removeFavorite} t={t} />
            </Route>
            <Route path="/">
              <section className="relative flex min-h-0 flex-1 flex-col">
                <div ref={scrollAreaRef} onScroll={(event) => {
                  const node = event.currentTarget;
                  setScrolledAway(node.scrollHeight - node.scrollTop - node.clientHeight > 120);
                }} className="min-h-0 flex-1 overflow-y-auto px-4 pb-3 pt-4 md:px-8 md:pb-5 md:pt-7">
                  <div className="mx-auto w-full max-w-[820px]">
                    {!activeConversation || activeConversation.messages.length === 0 ? (
                      <Welcome language={language} t={t} onPrompt={(prompt) => void sendMessage(prompt)} />
                    ) : (
                      <div className="space-y-7 pb-5">
                        <div className="flex justify-center">
                          <span className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-[10px] font-medium text-muted-foreground shadow-[0_2px_9px_hsl(var(--foreground)/.04)]"><Sparkles size={12} className="text-primary" />{t.loaded}</span>
                        </div>
                        {activeConversation.messages.map((message, index) => (
                          <MessageBubble
                            key={message.id}
                            message={message}
                            index={index}
                            isFavorite={favorites.some((favorite) => favorite.messageId === message.id)}
                            playing={playingMessageId === message.id}
                            speaking={speakingMessageId === message.id}
                            speechError={speechErrorId === message.id}
                            onFavorite={() => toggleFavorite(message)}
                            onRead={() => void readAloud(message)}
                            t={t}
                          />
                        ))}
                        {replyMutation.isPending && <TypingIndicator language={language} />}
                        {replyError && (
                          <div data-testid="status-chat-error" role="alert" className="rise-in flex gap-3 rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-[12px] leading-5 text-foreground">
                            <CircleHelp size={17} className="mt-0.5 shrink-0 text-destructive" />
                            <div className="flex-1">{replyError}</div>
                            <button type="button" data-testid="button-retry-message" onClick={() => {
                              const lastUser = [...(activeConversation?.messages ?? [])].reverse().find((message) => message.role === "user");
                              if (lastUser) void sendMessage(lastUser.content, true);
                            }} className="shrink-0 font-bold text-primary hover:underline">{language === "en" ? "Try again" : "फिर कोशिश करें"}</button>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                    {voiceError && <div data-testid="status-voice-error" role="status" className="mx-auto mt-3 max-w-2xl rounded-xl border border-amber-700/15 bg-amber-500/10 px-4 py-3 text-[12px] leading-5 text-foreground">{voiceError}</div>}
                  </div>
                </div>

                {scrolledAway && activeConversation && <button type="button" aria-label={language === "en" ? "Scroll to latest message" : "नए संदेश तक जाएँ"} data-testid="button-scroll-latest" onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })} className="absolute bottom-[188px] left-1/2 z-10 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-md transition hover:text-primary"><ArrowDown size={17} /></button>}

                <div className="shrink-0 border-t border-border/60 bg-background/90 px-3 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-lg md:px-8 md:pb-5 md:pt-4">
                  <div className="mx-auto max-w-[820px]">
                    {voiceError && <p data-testid="text-voice-error" className="mb-2 text-[11px] text-amber-800 dark:text-amber-300">{voiceError}</p>}
                    <form onSubmit={handleSubmit} className="relative rounded-[23px] border border-border bg-card p-2 shadow-[0_7px_25px_hsl(var(--foreground)/.055)] transition focus-within:border-primary/50 focus-within:shadow-[0_8px_26px_hsl(var(--primary)/.1)]">
                      <textarea
                        data-testid="input-chat-message"
                        aria-label={t.message}
                        rows={2}
                        maxLength={6000}
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            void sendMessage();
                          }
                        }}
                        placeholder={isListening ? t.listening : t.placeholder}
                        className="max-h-36 min-h-[52px] w-full resize-none bg-transparent px-3 pb-2 pt-2 text-[13px] leading-5 text-foreground outline-none placeholder:text-muted-foreground/80"
                      />
                      <div className="flex items-center justify-between gap-3 px-1">
                        <div className="flex items-center gap-1">
                          <button type="button" data-testid="button-open-preferences-composer" onClick={() => setIsPrefsOpen(true)} className="flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[10px] font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"><Settings2 size={13} /><span className="hidden xs:inline">{t.preferencesButton}</span><ChevronDown size={12} /></button>
                          <span className="hidden text-[10px] text-muted-foreground sm:inline">{preferences.servings} {t.servingLabel}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" aria-label={isListening ? "Stop voice input" : "Start voice input"} data-testid="button-voice-input" onClick={isListening ? stopVoiceInput : startVoiceInput} className={`flex h-9 w-9 items-center justify-center rounded-full transition ${isListening ? "animate-pulse bg-destructive/10 text-destructive" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}><Mic size={17} /></button>
                          <button type="submit" aria-label={language === "en" ? "Send message" : "संदेश भेजें"} data-testid="button-send-message" disabled={!draft.trim() || replyMutation.isPending} className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:scale-[1.04] disabled:cursor-not-allowed disabled:opacity-40"><Send size={16} /></button>
                        </div>
                      </div>
                    </form>
                    <p data-testid="text-chat-disclaimer" className="mt-2.5 text-center text-[9px] leading-4 text-muted-foreground">{t.hint}</p>
                  </div>
                </div>
              </section>
            </Route>
            <Route component={NotFound} />
          </Switch>
        </main>

        {isPrefsOpen && <PreferencesPanel preferences={preferences} language={language} onClose={() => setIsPrefsOpen(false)} onDiet={toggleDietFilter} onChange={setPreferences} t={t} />}
      </div>
    );
  }

  return AppShell();
}

function Welcome({ language, t, onPrompt }: { language: UiLanguage; t: typeof copy.en | typeof copy.hi; onPrompt: (prompt: string) => void }) {
  return (
    <div className="rise-in pb-2 pt-1 md:pb-5 md:pt-2">
      <div className="relative overflow-hidden rounded-[25px] border border-border/70 bg-card px-5 py-5 shadow-[0_12px_38px_hsl(var(--foreground)/.045)] md:px-8 md:py-6">
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 h-52 w-52 rounded-full border border-primary/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-1 -top-7 h-36 w-36 rounded-full border border-primary/10" />
        <div className="relative flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-secondary text-secondary-foreground"><Sparkles size={14} /></span>
          <span className="text-[9px] font-bold tracking-[.13em] text-secondary-foreground">{language === "en" ? "A LITTLE WISDOM FOR EVERYDAY COOKING" : "रोज़ के खाने के लिए थोड़ी समझदारी"}</span>
        </div>
        <h1 data-testid="text-welcome-heading" className="relative mt-3 max-w-xl font-display text-[31px] font-semibold leading-[1.04] tracking-[-.035em] text-foreground md:mt-4 md:text-[42px]">{t.welcome}</h1>
        <p data-testid="text-welcome-description" className="relative mt-2 max-w-[540px] text-[12px] leading-[1.55] text-muted-foreground md:mt-2.5 md:text-[13px]">{t.welcomeBody}</p>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 md:mt-6">
        <h2 className="font-display text-[16px] font-semibold tracking-tight">{t.quick}</h2>
        <span className="text-[9px] text-muted-foreground">{language === "en" ? "Tap to ask" : "पूछने के लिए चुनें"}</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-2 md:grid-cols-3 md:gap-2.5">
        {quickPrompts.map((prompt, index) => {
          const Icon = prompt.icon;
          return (
            <button key={prompt.kind} type="button" data-testid={prompt.kind} onClick={() => onPrompt(t.quicks[index])} className={`group flex min-h-[49px] items-center gap-2 rounded-[15px] border border-border/80 bg-card/70 px-2.5 py-2 text-left text-[10px] font-medium leading-[1.35] text-foreground transition hover:-translate-y-0.5 hover:border-primary/35 hover:bg-card hover:shadow-[0_8px_20px_hsl(var(--foreground)/.055)] md:min-h-[54px] md:gap-2.5 md:rounded-2xl md:px-3 md:text-[11px] ${index === 4 ? "col-span-2 md:col-span-2" : ""}`}>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] bg-secondary/70 text-secondary-foreground transition group-hover:bg-primary/10 group-hover:text-primary md:h-8 md:w-8"><Icon size={15} strokeWidth={1.8} /></span>
              <span className="flex-1">{t.quicks[index]}</span>
              <ArrowLeft size={12} className="rotate-180 shrink-0 text-muted-foreground/50 transition group-hover:translate-x-0.5 group-hover:text-primary" />
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-center gap-2 text-[9px] text-muted-foreground md:mt-5">
        <span className="h-px w-8 bg-border" /><span>{language === "en" ? "Good food begins with what you have" : "अच्छा खाना, घर की चीज़ों से ही शुरू होता है"}</span><span className="h-px w-8 bg-border" />
      </div>
    </div>
  );
}

function MessageBubble({
  message, index, isFavorite, playing, speaking, speechError, onFavorite, onRead, t,
}: {
  message: Message;
  index: number;
  isFavorite: boolean;
  playing: boolean;
  speaking: boolean;
  speechError: boolean;
  onFavorite: () => void;
  onRead: () => void;
  t: typeof copy.en | typeof copy.hi;
}) {
  const isAssistant = message.role === "assistant";
  const [copied, setCopied] = useState(false);
  async function copyReply() {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }
  return (
    <article data-testid={`message-${message.role}-${message.id}`} className={`rise-in flex gap-3 ${isAssistant ? "items-start" : "flex-row-reverse items-start"}`} style={{ animationDelay: `${Math.min(index * 45, 180)}ms` }}>
      {isAssistant && <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><ChefHat size={17} /></span>}
      <div className={`min-w-0 max-w-[86%] ${isAssistant ? "flex-1" : ""}`}>
        <div className={`rounded-[20px] px-4 py-3.5 md:px-5 ${isAssistant ? "rounded-tl-md border border-border/70 bg-card text-foreground shadow-[0_4px_17px_hsl(var(--foreground)/.035)]" : "rounded-tr-md bg-primary text-primary-foreground shadow-[0_5px_15px_hsl(var(--primary)/.13)]"}`}>
          {!isAssistant && <p data-testid={`text-user-message-${message.id}`} className="whitespace-pre-wrap text-[13px] leading-[1.75]">{message.content}</p>}
          {isAssistant && <div data-testid={`text-assistant-message-${message.id}`} className="whitespace-pre-wrap text-[13px] leading-[1.8] md:text-[14px]">{message.content}</div>}
        </div>
        {isAssistant ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-1">
            <button type="button" data-testid={`button-favorite-${message.id}`} onClick={onFavorite} aria-label={isFavorite ? t.saved : t.save} className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-semibold transition ${isFavorite ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>{isFavorite ? <Check size={13} /> : <Bookmark size={13} />}{isFavorite ? t.saved : t.save}</button>
            <button type="button" data-testid={`button-read-aloud-${message.id}`} onClick={onRead} aria-label={playing ? t.stop : t.read} className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-semibold transition ${playing ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>{speaking ? <AudioLines size={13} className="animate-pulse" /> : <Volume2 size={13} />}{speaking ? t.speaking : playing ? t.stop : t.read}</button>
            <button type="button" data-testid={`button-copy-${message.id}`} onClick={() => void copyReply()} aria-label="Copy reply" className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground">{copied ? <Check size={13} /> : <Copy size={13} />}<span>{copied ? "Copied" : "Copy"}</span></button>
            {speechError && <span role="status" data-testid={`status-speech-error-${message.id}`} className="w-full pl-2 text-[10px] text-destructive">{t.speechError}</span>}
          </div>
        ) : <p className="mt-1.5 pr-1 text-right text-[9px] text-muted-foreground">{new Date(message.createdAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</p>}
      </div>
    </article>
  );
}

function TypingIndicator({ language }: { language: UiLanguage }) {
  return (
    <div data-testid="status-assistant-typing" role="status" aria-label={language === "en" ? "RasoiMitra is thinking" : "RasoiMitra सोच रहा है"} className="rise-in flex items-start gap-3">
      <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground"><ChefHat size={17} /></span>
      <div className="flex items-center gap-1.5 rounded-[18px] rounded-tl-md border border-border/70 bg-card px-4 py-4">
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" /><span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" /><span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
        <span className="ml-2 text-[10px] text-muted-foreground">{language === "en" ? "Thinking it through…" : "सोच रहे हैं…"}</span>
      </div>
    </div>
  );
}

function PreferencesPanel({
  preferences, language, onClose, onDiet, onChange, t,
}: {
  preferences: Preferences;
  language: UiLanguage;
  onClose: () => void;
  onDiet: (filter: RasoiMitraPreferencesDietaryFiltersItem) => void;
  onChange: (update: (current: Preferences) => Preferences) => void;
  t: typeof copy.en | typeof copy.hi;
}) {
  const filters: { value: RasoiMitraPreferencesDietaryFiltersItem; label: string }[] = [
    { value: "vegetarian", label: t.vegetarian },
    { value: "low_oil", label: t.low_oil },
    { value: "high_protein", label: t.high_protein },
    { value: "weight_loss", label: t.weight_loss },
  ];
  const mealOptions: { value: RasoiMitraPreferencesMealType; label: string }[] = [
    { value: "unspecified", label: t.anyMeal },
    { value: "breakfast", label: t.breakfast },
    { value: "lunch", label: t.lunch },
    { value: "dinner", label: t.dinner },
    { value: "snack", label: t.snack },
  ];
  return (
    <>
      <button type="button" aria-label={t.close} data-testid="button-close-preferences-backdrop" onClick={onClose} className="fixed inset-0 z-[60] bg-foreground/30 backdrop-blur-[2px]" />
      <aside data-testid="panel-cooking-preferences" className="rise-in fixed inset-y-0 right-0 z-[70] flex w-full max-w-[390px] flex-col border-l border-border bg-background shadow-2xl">
        <div className="flex items-start justify-between border-b border-border/70 px-6 py-5">
          <div>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-secondary-foreground"><Settings2 size={17} /></span>
            <h2 className="mt-4 font-display text-[24px] font-semibold">{t.preferences}</h2>
            <p className="mt-1 text-[12px] text-muted-foreground">{language === "en" ? "A few details help me make it yours." : "कुछ बातें बताने से सुझाव आपके लिए बेहतर होंगे।"}</p>
          </div>
          <button type="button" aria-label={t.close} data-testid="button-close-preferences" onClick={onClose} className="rounded-xl p-2 text-muted-foreground hover:bg-accent"><X size={18} /></button>
        </div>
        <div className="flex-1 space-y-7 overflow-y-auto px-6 py-6">
          <section>
            <h3 className="text-[11px] font-bold tracking-wide">{t.diet}</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {filters.map((filter) => {
                const active = preferences.dietaryFilters.includes(filter.value);
                return <button key={filter.value} type="button" aria-pressed={active} data-testid={`button-diet-${filter.value}`} onClick={() => onDiet(filter.value)} className={`rounded-full border px-3 py-2 text-[11px] font-medium transition ${active ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/35 hover:text-foreground"}`}>{active && <Check size={12} className="mr-1 inline" />}{filter.label}</button>;
              })}
            </div>
          </section>
          <section>
            <label htmlFor="meal-select" className="text-[11px] font-bold tracking-wide">{t.meal}</label>
            <div className="relative mt-3">
              <select id="meal-select" data-testid="select-meal-type" value={preferences.mealType} onChange={(event) => onChange((current) => ({ ...current, mealType: event.target.value as RasoiMitraPreferencesMealType }))} className="w-full appearance-none rounded-xl border border-border bg-card px-3.5 py-3 text-[12px] text-foreground outline-none focus:border-primary">
                {mealOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select><ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
          </section>
          <section>
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-bold tracking-wide">{t.servings}</h3>
              <span data-testid="text-servings-value" className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold text-secondary-foreground">{preferences.servings} {t.servingLabel}</span>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl border border-border bg-card p-2">
              <button type="button" aria-label="Decrease servings" data-testid="button-decrease-servings" disabled={preferences.servings <= 1} onClick={() => onChange((current) => ({ ...current, servings: Math.max(1, current.servings - 1) }))} className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-muted-foreground hover:bg-accent disabled:opacity-35">−</button>
              <span className="text-[12px] font-semibold">{preferences.servings}</span>
              <button type="button" aria-label="Increase servings" data-testid="button-increase-servings" disabled={preferences.servings >= 20} onClick={() => onChange((current) => ({ ...current, servings: Math.min(20, current.servings + 1) }))} className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-muted-foreground hover:bg-accent disabled:opacity-35">+</button>
            </div>
          </section>
          <section className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
            <div className="pr-4">
              <h3 className="text-[11px] font-bold">{t.leftovers}</h3>
              <p className="mt-1 text-[10px] leading-4 text-muted-foreground">{language === "en" ? "Find a new life for what’s already cooked." : "पहले से बने खाने को नए तरीके से इस्तेमाल करें।"}</p>
            </div>
            <button type="button" role="switch" aria-checked={preferences.useLeftovers} aria-label={t.leftovers} data-testid="switch-use-leftovers" onClick={() => onChange((current) => ({ ...current, useLeftovers: !current.useLeftovers }))} className={`relative h-6 w-11 shrink-0 rounded-full transition ${preferences.useLeftovers ? "bg-primary" : "bg-muted"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${preferences.useLeftovers ? "translate-x-6" : "translate-x-1"}`} /></button>
          </section>
        </div>
        <div className="border-t border-border/70 p-5">
          <button type="button" data-testid="button-done-preferences" onClick={onClose} className="w-full rounded-xl bg-primary py-3 text-[12px] font-semibold text-primary-foreground transition hover:brightness-105">{language === "en" ? "Done" : "हो गया"}</button>
        </div>
      </aside>
    </>
  );
}

function FavoritesPage({
  favorites, language, onRemove, t,
}: {
  favorites: Favorite[];
  language: UiLanguage;
  onRemove: (id: string) => void;
  t: typeof copy.en | typeof copy.hi;
}) {
  return (
    <section className="flex-1 overflow-y-auto px-4 py-7 md:px-9 md:py-10">
      <div className="mx-auto max-w-[800px]">
        <Link href="/" data-testid="link-back-to-chat" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-[11px] font-semibold text-muted-foreground no-underline transition hover:text-foreground"><ArrowLeft size={14} />{t.backToChat}</Link>
        <div className="mt-7 flex items-end justify-between gap-3">
          <div>
            <p className="text-[9px] font-bold tracking-[.17em] text-primary">{language === "en" ? "YOUR PERSONAL RECIPE BOX" : "आपकी अपनी रेसिपी की किताब"}</p>
            <h1 data-testid="text-favorites-heading" className="mt-2 font-display text-[36px] font-semibold leading-tight tracking-[-.03em] md:text-[44px]">{t.savedTitle}</h1>
            <p data-testid="text-favorites-description" className="mt-2 max-w-lg text-[13px] leading-6 text-muted-foreground">{t.savedIntro}</p>
          </div>
          <span className="mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Bookmark size={20} /></span>
        </div>
        {favorites.length === 0 ? (
          <div data-testid="empty-favorites" className="mt-8 rounded-[26px] border border-dashed border-border bg-card/60 px-6 py-14 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground"><Utensils size={23} /></span>
            <h2 className="mt-5 font-display text-xl font-semibold">{t.noSaved}</h2>
            <p className="mx-auto mt-2 max-w-sm text-[12px] leading-5 text-muted-foreground">{t.noSavedBody}</p>
            <Link href="/" data-testid="link-start-saving" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[11px] font-semibold text-primary-foreground no-underline transition hover:brightness-105"><Plus size={14} />{t.start}</Link>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {favorites.map((favorite, index) => {
              return (
                <article key={favorite.messageId} data-testid={`card-favorite-${favorite.messageId}`} className="rise-in rounded-[23px] border border-border bg-card p-5 shadow-[0_5px_20px_hsl(var(--foreground)/.035)] md:p-6" style={{ animationDelay: `${Math.min(index * 50, 200)}ms` }}>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-secondary text-secondary-foreground"><ChefHat size={13} /></span>
                    <span className="font-semibold text-foreground">{language === "en" ? "Saved recipe" : "सहेजी गई रेसिपी"}</span>
                    <span className="ml-auto">{new Date(favorite.savedAt).toLocaleDateString(language === "hi" ? "hi-IN" : "en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                  <p data-testid={`text-favorite-content-${favorite.messageId}`} className="mt-4 whitespace-pre-wrap text-[13px] leading-[1.8] text-foreground">{favorite.content}</p>
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-border/60 pt-3">
                    <button type="button" data-testid={`button-remove-favorite-${favorite.messageId}`} onClick={() => onRemove(favorite.messageId)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[10px] font-semibold text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"><X size={12} />{t.remove}</button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function AppRoot() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <TooltipProvider>
          <RoutedErrorBoundary>
            <Switch>
              <Route path="/" component={App} />
              <Route path="/favorites" component={App} />
              <Route component={NotFound} />
            </Switch>
          </RoutedErrorBoundary>
          <Toaster />
        </TooltipProvider>
      </WouterRouter>
    </QueryClientProvider>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

export default AppRoot;