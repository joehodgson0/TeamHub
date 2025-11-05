import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE_URL } from '@/lib/config';
import { queryClient } from '@/lib/queryClient';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export default function Posts() {
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'announcement' as 'announcement' | 'kit_request' | 'player_request',
    scope: 'team' as 'team' | 'club',
    title: '',
    content: '',
  });

  const canCreatePost = user?.roles?.includes('coach');

  const { data: postsResponse, isLoading } = useQuery({
    queryKey: ['/api/posts-session'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/posts-session`, {
        credentials: 'include',
      });
      return response.json();
    },
    enabled: !!user,
  });

  const posts = postsResponse?.posts || [];

  const createPostMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`${API_BASE_URL}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      return response.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['/api/posts-session'] });
        setShowCreateModal(false);
        setFormData({ type: 'announcement', scope: 'team', title: '', content: '' });
        Alert.alert('Success', 'Post created successfully!');
      } else {
        Alert.alert('Error', result.error || 'Failed to create post');
      }
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to create post');
    },
  });

  const handleCreatePost = () => {
    if (!formData.title || !formData.content) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    createPostMutation.mutate({
      type: formData.type,
      scope: formData.scope,
      title: formData.title,
      content: formData.content,
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'kit-request':
        return '👕';
      case 'announcement':
        return '📢';
      case 'event':
        return '📅';
      default:
        return '📝';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'kit-request':
        return '#3B82F6';
      case 'announcement':
        return '#10B981';
      case 'event':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  const formatCategoryName = (category: string) => {
    if (!category) return 'General';
    return category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Posts & Announcements</Text>
          {canCreatePost && (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.createButtonText}>+ Create</Text>
            </TouchableOpacity>
          )}
        </View>
        {isLoading ? (
          <Text style={styles.loadingText}>Loading posts...</Text>
        ) : posts.length > 0 ? (
          <View style={styles.postsContainer}>
            {posts.map((post: any) => (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryIcon}>{getCategoryIcon(post.category)}</Text>
                    <View style={[styles.categoryPill, { backgroundColor: getCategoryColor(post.category) }]}>
                      <Text style={styles.categoryText}>{formatCategoryName(post.category)}</Text>
                    </View>
                  </View>
                  {post.createdAt && (
                    <Text style={styles.postDate}>{formatDate(post.createdAt)}</Text>
                  )}
                </View>
                
                <Text style={styles.postTitle}>{post.title}</Text>
                <Text style={styles.postContent} numberOfLines={3}>{post.content}</Text>
                
                {post.authorName && (
                  <View style={styles.authorContainer}>
                    <View style={styles.authorAvatar}>
                      <Text style={styles.authorInitials}>
                        {post.authorName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                      </Text>
                    </View>
                    <Text style={styles.authorName}>{post.authorName}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>
              Posts and announcements from your teams will appear here
            </Text>
          </View>
        )}
      </View>

      {/* Create Post Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Post</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.type === 'announcement' && styles.typeButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, type: 'announcement' })}
                >
                  <Text style={[
                    styles.typeButtonText,
                    formData.type === 'announcement' && styles.typeButtonTextActive,
                  ]}>
                    📢 Announcement
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.type === 'kit_request' && styles.typeButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, type: 'kit_request' })}
                >
                  <Text style={[
                    styles.typeButtonText,
                    formData.type === 'kit_request' && styles.typeButtonTextActive,
                  ]}>
                    👕 Kit Request
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.type === 'player_request' && styles.typeButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, type: 'player_request' })}
                >
                  <Text style={[
                    styles.typeButtonText,
                    formData.type === 'player_request' && styles.typeButtonTextActive,
                  ]}>
                    ⚽ Player Request
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Visibility</Text>
              <View style={styles.scopeButtons}>
                <TouchableOpacity
                  style={[
                    styles.scopeButton,
                    formData.scope === 'team' && styles.scopeButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, scope: 'team' })}
                >
                  <Text style={[
                    styles.scopeButtonText,
                    formData.scope === 'team' && styles.scopeButtonTextActive,
                  ]}>
                    Team Only
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.scopeButton,
                    formData.scope === 'club' && styles.scopeButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, scope: 'club' })}
                >
                  <Text style={[
                    styles.scopeButtonText,
                    formData.scope === 'club' && styles.scopeButtonTextActive,
                  ]}>
                    Entire Club
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="Post title"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Content</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.content}
                onChangeText={(text) => setFormData({ ...formData, content: text })}
                placeholder="Write your post content..."
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleCreatePost}
                disabled={createPostMutation.isPending}
              >
                <Text style={styles.submitButtonText}>
                  {createPostMutation.isPending ? 'Creating...' : 'Create Post'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  postsContainer: {
    gap: 15,
  },
  postCard: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryIcon: {
    fontSize: 18,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  postDate: {
    fontSize: 12,
    color: '#999',
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#111',
  },
  postContent: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 12,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  authorInitials: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  authorName: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 120,
  },
  typeButtons: {
    flexDirection: 'column',
    gap: 8,
  },
  typeButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#333',
  },
  typeButtonTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  scopeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  scopeButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
  },
  scopeButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  scopeButtonText: {
    fontSize: 14,
    color: '#333',
  },
  scopeButtonTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
