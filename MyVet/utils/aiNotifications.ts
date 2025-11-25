// utils/aiNotifications.ts
import * as Notifications from "expo-notifications";
import { Alert, Platform } from "react-native";
import { openai } from "@/utils/openai";

// Configuración del handler
Notifications.setNotificationHandler({
  handleNotification: async () =>
    ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    } as Notifications.NotificationBehavior),
});

/**
 * 👉 Llamamos a la IA real usando tu cliente OpenAI
 */
async function generateAINotificationText(): Promise<string> {
  try {
    const completion = await openai.responses.create({
      model: "gpt-4o-mini",
      input: `
      Dame UN solo dato curioso sobre mascotas. 
      Debe ser corto, llamativo, curioso y útil.
      Estilo amigable y con un emoji al inicio. 
      Solo devuélveme 1 frase.
      `,
    });

    const text =
      completion.output_text || "🐾 Tu mascota es increíble. ¡Cuídala siempre!";

    return text.trim();
  } catch (error) {
    console.log("Error con IA:", error);
    return "🐾 ¿Sabías que tener una mascota reduce el estrés? 😺";
  }
}

/**
 * 👉 Enviar notificación inmediata (para mostrarle al profe)
 */
export async function sendImmediateAINotification() {
  try {
    // Permisos
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      Alert.alert("Permisos necesarios", "No concediste permisos.");
      return;
    }

    // Canal Android
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    // Generar texto IA
    const aiText = await generateAINotificationText();

    // Noti local
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🐾 MyVet - Dato curioso",
        body: aiText,
        sound: true,
      },
      
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1 },
    });
  } catch (error) {
    console.log(error);
    Alert.alert("Error", "No se pudo enviar la notificación.");
  }
}
