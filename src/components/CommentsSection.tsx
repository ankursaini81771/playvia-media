import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
import { Send, X, MessageSquareOff } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { formatTimeAgo } from '../utils/format';

interface CommentItem {
  id: string;
  text: string;
  created_at: string;
  user_id: string;
  users?: {
    username: string;
    avatar_url: string;
  };
}

interface CommentsSectionProps {
  videoId: string;
  videoOwnerId: string;
  videoTitle: string;
  onClose?: () => void;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({ videoId, videoOwnerId, videoTitle, onClose }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load comments
  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*, users(username, avatar_url)')
        .eq('video_id', videoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.warn('Error loading comments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [videoId]);

  const handleSubmitComment = async () => {
    if (!user || !inputText.trim() || submitting) return;

    setSubmitting(true);
    const commentText = inputText.trim();
    setInputText('');

    try {
      // 1. Insert into comments
      const { data, error } = await supabase
        .from('comments')
        .insert({
          video_id: videoId,
          user_id: user.id,
          text: commentText,
        })
        .select('*, users(username, avatar_url)')
        .single();

      if (error || !data) {
        throw error || new Error('Failed to save comment record.');
      }

      // 2. Prepend to local comment array
      setComments((prev) => [data, ...prev]);

      // 3. Trigger notification to video owner if commenting on someone else's video
      if (user.id !== videoOwnerId) {
        await supabase.from('notifications').insert({
          user_id: videoOwnerId, // recipient
          sender_id: user.id, // actor
          type: 'comment',
          message: `${user.username} commented on "${videoTitle}": "${commentText}"`,
          video_id: videoId,
        });
      }
    } catch (err) {
      console.warn('Failed to insert comment', err);
      setInputText(commentText); // Restore input text on failure
    } finally {
      setSubmitting(false);
    }
  };

  const renderCommentItem = ({ item }: { item: CommentItem }) => {
    const authorName = item.users?.username || 'PlayVia User';
    const authorAvatar = item.users?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop';

    return (
      <View style={styles.commentRow}>
        <Image source={{ uri: authorAvatar }} style={styles.avatar} />
        
        <View style={styles.commentDetails}>
          <View style={styles.commentHeader}>
            <Text style={styles.username}>{authorName}</Text>
            <Text style={styles.timestamp}>{formatTimeAgo(item.created_at)}</Text>
          </View>
          <Text style={styles.commentText}>{item.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      style={styles.container}
    >
      {/* Title Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Comments <Text style={styles.commentCount}>({comments.length})</Text>
        </Text>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={20} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>

      {/* Comment List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      ) : comments.length === 0 ? (
        <View style={styles.centerContainer}>
          <MessageSquareOff size={32} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>No comments yet. Be the first to reply!</Text>
        </View>
      ) : (
        <FlatList
          data={comments}
          renderItem={renderCommentItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Input Box */}
      <View style={styles.inputContainer}>
        {user ? (
          <>
            <Image 
              source={{ uri: user.avatar_url }} 
              style={styles.inputAvatar} 
            />
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Add a comment..."
              placeholderTextColor={COLORS.textSecondary}
              style={styles.textInput}
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              onPress={handleSubmitComment} 
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              disabled={!inputText.trim() || submitting}
            >
              <Send size={16} color={COLORS.black} />
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.loginPrompt}>Log in to comment on this video.</Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  commentCount: {
    color: COLORS.textSecondary,
    fontWeight: 'normal',
  },
  closeButton: {
    padding: 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  commentRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: COLORS.background,
  },
  commentDetails: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  commentText: {
    fontSize: 12,
    color: '#DDDDDD',
    lineHeight: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  inputAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    color: COLORS.textPrimary,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    maxHeight: 80,
  },
  sendButton: {
    backgroundColor: COLORS.white,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  loginPrompt: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    flex: 1,
    paddingVertical: 6,
  },
});
