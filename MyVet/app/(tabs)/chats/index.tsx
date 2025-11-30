// app/(tabs)/chats/index.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Chat } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { SwipeListView } from 'react-native-swipe-list-view';

interface ChatWithLastMessage extends Chat {
  lastMessage?: string;
  lastMessageTime?: string;
}

export default function ChatsScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [chats, setChats] = useState<ChatWithLastMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Cargar chats cuando la pantalla obtiene foco
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadChats();
      }
    }, [user])
  );

  const loadChats = async (showLoading = true) => {
    try {
      if (showLoading && !refreshing) setLoading(true);
  
      const { data: chatsData, error: chatsError } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false });
  
      if (chatsError) throw chatsError;
  
      const chatsWithMessages = await Promise.all(
        (chatsData || []).map(async (chat) => {
          const { data: messages } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: false })
            .limit(1);
  
          return {
            ...chat,
            lastMessage: messages?.[0]?.content || 'Sin mensajes',
            lastMessageTime: messages?.[0]?.created_at || chat.created_at,
          };
        })
      );
  
      setChats(chatsWithMessages);
    } catch (error) {
      console.error('Error al cargar chats:', error);
      Alert.alert('Error', 'No se pudieron cargar los chats');
    } finally {
      if (showLoading) setLoading(false); // 👈 solo muestra loading si lo pedimos
      setRefreshing(false);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadChats();
  };

  const createNewChat = async () => {
    try {
      const { data, error } = await supabase
        .from('chats')
        .insert([
          {
            user_id: user?.id,
            title: 'Nueva consulta',
          },
        ])
        .select()
        .single();
  
      if (error) throw error;
  
      if (data) {
        // Actualizar lista sin activar loading
        setChats((prev) => [data, ...prev]);
  
        // Navegar directamente al chat sin refrescar la lista
        router.push(`/chats/${data.id}`);
      }
    } catch (error) {
      console.error('Error al crear chat:', error);
      Alert.alert('Error', 'No se pudo crear el chat');
    }
  };
  
  const deleteChat = async (chatId: string) => {
    try {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);

      if (error) throw error;

      setChats(chats.filter((chat) => chat.id !== chatId));
    } catch (error) {
      console.error('Error al eliminar chat:', error);
      Alert.alert('Error', 'No se pudo eliminar el chat');
    }
  };

  const confirmDelete = (chatId: string) => {
    Alert.alert(
      'Eliminar chat',
      '¿Estás seguro de que quieres eliminar esta conversación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteChat(chatId) },
      ]
    );
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInHours < 48) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
      });
    }
  };

  const renderChatItem = (data: { item: ChatWithLastMessage }) => {
    const item = data.item;

    return (
      <TouchableOpacity
        style={[styles.chatItem, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.borderLight }]}
        onPress={() => router.push(`/chats/${item.id}`)}
        activeOpacity={1}
      >
        <View style={[styles.chatIcon, { backgroundColor: theme.colors.primaryLight }]}>
          <Ionicons name="medical" size={24} color={theme.colors.primary} />
        </View>

        <View style={styles.chatInfo}>
          <Text style={[styles.chatTitle, { color: theme.colors.text }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.chatLastMessage, { color: theme.colors.textSecondary }]} numberOfLines={1}>{item.lastMessage}</Text>
        </View>

        <View style={styles.chatMeta}>
          <Text style={[styles.chatTime, { color: theme.colors.textTertiary }]}>{formatTime(item.lastMessageTime || item.updated_at)}</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderHiddenItem = (data: { item: ChatWithLastMessage }) => (
    <View style={styles.rowBack}>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => confirmDelete(data.item.id)}
      >
        <Ionicons name="trash" size={24} color="#fff" />
        <Text style={styles.deleteButtonText}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <Text style={styles.headerTitle}>Chats</Text>
      </View>

      {/* LISTA */}
      {chats.length === 0 && !refreshing ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={80} color={theme.colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No tienes consultas</Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
            Crea una nueva consulta para hablar con el veterinario virtual
          </Text>
        </View>
      ) : (
        <SwipeListView
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={renderChatItem}
          renderHiddenItem={renderHiddenItem}
          rightOpenValue={-100}
          disableRightSwipe
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
        />
      )}

      {/* BOTÓN FLOTANTE */}
      <TouchableOpacity style={[styles.fab, { backgroundColor: theme.colors.primary }]} onPress={createNewChat}>
        <Ionicons name="add" size={34} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  /* HEADER MORADO */
  header: {
    paddingTop: 55,
    paddingBottom: 40,
    paddingHorizontal: 25,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 25,
    textAlign: "center",
  },

  /* BOTÓN FLOTANTE */
  fab: {
    position: "absolute",
    bottom: 100,
    right: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  /* LISTA */
  listContainer: {
    paddingTop: 10,
    paddingBottom: 100,
  },

  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },

  chatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  chatInfo: {
    flex: 1,
  },

  chatTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 3,
  },

  chatLastMessage: {
    fontSize: 14,
  },

  chatMeta: {
    alignItems: "flex-end",
    justifyContent: "center",
  },

  chatTime: {
    fontSize: 12,
    marginBottom: 4,
  },

  /* SWIPE DELETE */
  rowBack: {
    alignItems: "center",
    backgroundColor: "#FF5A5A",
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
  },

  deleteButton: {
    width: 100,
    height: "100%",
    backgroundColor: "#FF5A5A",
    justifyContent: "center",
    alignItems: "center",
  },

  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    marginTop: 5,
    fontWeight: "600",
  },

  /* ESTADO VACÍO */
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },

  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 8,
  },

  emptySubtitle: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 30,
  },
});

