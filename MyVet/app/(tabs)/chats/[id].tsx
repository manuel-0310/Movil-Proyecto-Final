// app/(tabs)/chats/[id].tsx
import { Dimensions } from "react-native";
const { height } = Dimensions.get("window");
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { supabase } from "@/utils/supabase";
import { openai, VETERINARY_SYSTEM_PROMPT } from "@/utils/openai";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Message } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import Markdown from "react-native-markdown-display";

export default function ChatConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { theme } = useTheme();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [assistantTyping, setAssistantTyping] = useState(false);
  const [chatTitle, setChatTitle] = useState("Cargando...");
  const [shouldAutoRespond, setShouldAutoRespond] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  /** ----------------------------------------------------------
   *  CARGA INICIAL
   * ---------------------------------------------------------- */
  useEffect(() => {
    if (id && user) {
      loadChat();
      loadMessages();
    }
  }, [id, user]);

  // Auto-responder cuando hay un mensaje inicial del usuario
  useEffect(() => {
    if (shouldAutoRespond && messages.length === 1 && messages[0].role === 'user') {
      handleAutoResponse();
      setShouldAutoRespond(false);
    }
  }, [messages, shouldAutoRespond]);

  const loadChat = async () => {
    try {
      const { data } = await supabase
        .from("chats")
        .select("title")
        .eq("id", id)
        .single();

      if (data) setChatTitle(data.title);
    } catch (error) {
      console.error("Error al cargar chat:", error);
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      
      // Si hay exactamente 1 mensaje y es del usuario, auto-responder
      if (data && data.length === 1 && data[0].role === 'user') {
        setShouldAutoRespond(true);
      }
    } catch (error) {
      console.error("Error al cargar mensajes:", error);
      Alert.alert("Error", "No se pudieron cargar los mensajes");
    } finally {
      setLoading(false);
    }
  };

  /** ----------------------------------------------------------
   *  AUTO-RESPUESTA PARA MENSAJE INICIAL DESDE HOME
   * ---------------------------------------------------------- */
  const handleAutoResponse = async () => {
    if (messages.length !== 1 || messages[0].role !== 'user') return;

    const userMessage = messages[0].content;

    try {
      setAssistantTyping(true);

      // Generar título
      const aiTitle = await generateTitleFromAI(userMessage);
      await supabase
        .from("chats")
        .update({
          title: aiTitle,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      setChatTitle(aiTitle);

      // Preparar prompt para IA
      const conversationHistory = [
        { role: "system", content: VETERINARY_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ];

      const prompt = conversationHistory
        .map(m => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n\n");

      const completion = await openai.responses.create({
        model: "gpt-4o-mini",
        input: prompt,
        temperature: 0.7,
        max_output_tokens: 1000,
      });

      const assistantMessage = completion.output_text?.trim() || "Lo siento, no pude generar una respuesta.";

      setAssistantTyping(false);

      // Guardar respuesta
      const { data: assistantMessageData } = await supabase
        .from("messages")
        .insert([{ chat_id: id, role: "assistant", content: assistantMessage }])
        .select()
        .single();

      setMessages((prev) => [...prev, assistantMessageData]);

      await supabase
        .from("chats")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", id);

      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100
      );
    } catch (err) {
      console.error("Error en auto-respuesta:", err);
      setAssistantTyping(false);
      Alert.alert("Error", "No se pudo generar la respuesta automática.");
    }
  };

  /** ----------------------------------------------------------
   *  GENERADOR DE TÍTULO CON IA
   * ---------------------------------------------------------- */
  const generateTitleFromAI = async (userMessage: string) => {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Genera un título muy corto (máximo 4 palabras) que resuma una consulta veterinaria. No respondas nada más."
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        temperature: 0.4,
        max_tokens: 20,
      });

      const title =
        completion.choices[0]?.message?.content?.trim() ||
        userMessage.slice(0, 40);

      return title;
    } catch (e) {
      console.log("Error generando título:", e);
      return userMessage.slice(0, 40);
    }
  };

  /** ----------------------------------------------------------
   *  ENVÍO DE MENSAJE
   * ---------------------------------------------------------- */
  const sendMessage = async () => {
    if (!inputText.trim() || sending) return;

    const userMessage = inputText.trim();
    setInputText("");
    setSending(true);

    try {
      /** 1. Guardar mensaje del usuario */
      const { data: userMessageData, error: userError } = await supabase
        .from("messages")
        .insert([{ chat_id: id, role: "user", content: userMessage }])
        .select()
        .single();

      if (userError) throw userError;

      setMessages((prev) => [...prev, userMessageData]);

      /** 2. Generar título si es el PRIMER mensaje */
      if (messages.length === 0) {
        const aiTitle = await generateTitleFromAI(userMessage);

        await supabase
          .from("chats")
          .update({
            title: aiTitle,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);

        setChatTitle(aiTitle);
      }

      /** 3. Mostrar typing bubble */
      setAssistantTyping(true);

      /** 4. Preparar historial de conversación */
      const conversationHistory = [
        { role: "system", content: VETERINARY_SYSTEM_PROMPT },
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { role: "user", content: userMessage },
      ];

      /** 5. Llamar a la IA */
      const prompt = conversationHistory
        .map(m => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n\n");

      const completion = await openai.responses.create({
        model: "gpt-4o-mini",
        input: prompt,
        temperature: 0.7,
        max_output_tokens: 1000,
      });

      const assistantMessage = completion.output_text?.trim() || "Lo siento, no pude generar una respuesta.";

      setAssistantTyping(false);

      /** 6. Guardar respuesta de la IA */
      const { data: assistantMessageData } = await supabase
        .from("messages")
        .insert([{ chat_id: id, role: "assistant", content: assistantMessage }])
        .select()
        .single();

      setMessages((prev) => [...prev, assistantMessageData]);

      await supabase
        .from("chats")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", id);

      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100
      );
    } catch (err) {
      console.error("Error al enviar mensaje:", err);
      Alert.alert("Error", "No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
      setAssistantTyping(false);
    }
  };

  /** ----------------------------------------------------------
   *  RENDER DE CADA BURBUJA
   * ---------------------------------------------------------- */
  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";

    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
        ]}
      >
        {!isUser && (
          <View style={[styles.avatarContainer, { backgroundColor: theme.colors.primaryLight }]}>
            <Ionicons name="medical" size={20} color={theme.colors.primary} />
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isUser 
              ? [styles.userBubble, { backgroundColor: theme.colors.primary }]
              : [styles.assistantBubble, { backgroundColor: theme.colors.cardBackground }],
          ]}
        >
          <Markdown
            style={{
              body: {
                ...styles.messageText,
                ...(isUser 
                  ? [styles.userText, { color: theme.colors.textInverse }]
                  : [styles.assistantText, { color: theme.colors.text }]),
              },
              strong: { fontWeight: "bold" },
              paragraph: { marginBottom: 6 },
            }}
          >
            {item.content}
          </Markdown>

          <Text
            style={[
              styles.messageTime,
              isUser 
                ? [styles.userTime, { color: theme.colors.textInverse + 'CC' }]
                : [styles.assistantTime, { color: theme.colors.textTertiary }],
            ]}
          >
            {new Date(item.created_at).toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>

        {isUser && (
          <View style={[styles.avatarContainer, { backgroundColor: theme.colors.primaryLight }]}>
            <Ionicons name="person" size={20} color={theme.colors.primary} />
          </View>
        )}
      </View>
    );
  };

  /** ----------------------------------------------------------
   *  LOADING
   * ---------------------------------------------------------- */
  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  /** ----------------------------------------------------------
   *  UI FINAL
   * ---------------------------------------------------------- */
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* HEADER */}
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color={theme.colors.textInverse} />
          </TouchableOpacity>

          <Text numberOfLines={1} style={[styles.headerTitle, { color: theme.colors.textInverse }]}>
            {chatTitle}
          </Text>

          <View style={{ width: 26 }} />
        </View>

        {/* LISTA DE MENSAJES */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color={theme.colors.primaryLight} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Haz tu primera consulta al veterinario virtual
              </Text>
            </View>
          }
        />

        {/* BURBUJA TYPING */}
        {assistantTyping && (
          <View style={styles.typingContainer}>
            <View style={[styles.avatarContainer, { backgroundColor: theme.colors.primaryLight }]}>
              <Ionicons name="medical" size={20} color={theme.colors.primary} />
            </View>

            <View style={[styles.typingBubble, { backgroundColor: theme.colors.cardBackground }]}>
              {[0, 1, 2].map((i) => (
                <MotiView
                  key={i}
                  from={{ opacity: 0.3, translateY: 0 }}
                  animate={{ opacity: 1, translateY: -4 }}
                  transition={{
                    duration: 500,
                    loop: true,
                    delay: i * 150,
                    type: "timing",
                  }}
                  style={[styles.dot, { backgroundColor: theme.colors.primary }]}
                />
              ))}
            </View>
          </View>
        )}

        {/* INPUT */}
        <View style={[styles.inputContainer, { 
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border
        }]}>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.colors.cardBackground,
              color: theme.colors.text,
              borderColor: theme.colors.border
            }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Escribe tu consulta..."
            placeholderTextColor={theme.colors.textTertiary}
            multiline
            maxLength={500}
            editable={!sending}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: theme.colors.primary },
              (!inputText.trim() || sending) && styles.sendButtonDisabled,
            ]}
            disabled={!inputText.trim() || sending}
            onPress={sendMessage}
          >
            {sending ? (
              <ActivityIndicator size="small" color={theme.colors.textInverse} />
            ) : (
              <Ionicons name="send" size={20} color={theme.colors.textInverse} />
            )}
          </TouchableOpacity>
        </View>
        
        </KeyboardAvoidingView>
        
        <View style={[styles.footerContainer, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.footerText, { color: theme.colors.textTertiary }]}>
            Chat impulsado por IA. No sustituye la atención veterinaria profesional.
          </Text>
        </View>
         
    </>
  );
}

const styles = StyleSheet.create({
  /* GENERAL */
  container: {
    flex: 1,
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  /* HEADER */
  header: {
    paddingTop: 70,
    paddingBottom: 25,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    justifyContent: "space-between",
  },

  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },

  /* MENSAJES */
  messagesList: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },

  messageContainer: {
    flexDirection: "row",
    marginVertical: 7,
    alignItems: "flex-end",
  },

  userMessageContainer: {
    marginLeft: "auto",
  },

  assistantMessageContainer: {
    marginRight: "auto",
    flexDirection: "row",
  },

  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal:5,
  },

  messageBubble: {
    maxWidth: "70%",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },

  userBubble: {
    borderBottomRightRadius: 3,
  },

  assistantBubble: {
    borderBottomLeftRadius: 3,
  },

  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },

  userText: {
    // Color aplicado dinámicamente
  },

  assistantText: {
    // Color aplicado dinámicamente
  },

  messageTime: {
    fontSize: 11,
    marginTop: 5,
  },

  userTime: {
    textAlign: "right",
  },

  assistantTime: {
    // Color aplicado dinámicamente
  },

  /* EMPTY STATE */
  emptyContainer: {
    minHeight: height * 0.65,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  

  emptyText: {
    marginTop: 14,
    fontSize: 15,
    textAlign: "center",
  },

  /* TYPING */
  typingContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    marginBottom: 6,
  },

  typingBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  /* INPUT */
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
  },

  input: {
    flex: 1,
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 120,
    borderWidth: 1,
  },

  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },

  sendButtonDisabled: {
    opacity: 0.5,
  },

  footerContainer: {
    alignItems: "center",
    paddingBottom: 20,
    paddingHorizontal: 20,
  },

  footerText: {
    fontSize: 12,
    textAlign: "center",
    maxWidth: 300,
  },
});
