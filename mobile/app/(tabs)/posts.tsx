import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, RefreshControl } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE_URL } from '@/lib/config';
import { queryClient } from '@/lib/queryClient';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function Posts() {
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [formData, setFormData] = useState({
    type: 'announcement' as 'announcement' | 'kit_request' | 'player_request',
    scope: 'team' as 'team' | 'club',
    teamId: '',
    title: '',
    content: '',
  });

  const canCreatePost = user?.roles?.includes('coach');

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['/api/posts-session'] });
    await queryClient.invalidateQueries({ queryKey: ['/api/teams/club', user?.clubId] });
    await queryClient.invalidateQueries({ queryKey: ['/api/players/parent', user?.id] });
    setRefreshing(false);
  };

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

  // Fetch user's teams for team selection and filtering
  const { data: teamsResponse } = useQuery({
    queryKey: ['/api/teams/club', user?.clubId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/teams/club/${user?.clubId}`, {
        credentials: 'include',
      });
      return response.json();
    },
    enabled: !!user?.clubId,
  });

  // Fetch user's players for filtering posts
  const { data: playersResponse } = useQuery({
    queryKey: ['/api/players/parent', user?.id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/players/parent/${user?.id}`, {
        credentials: 'include',
      });
      return response.json();
    },
    enabled: !!user?.id && user?.roles?.includes('parent'),
  });

  // Filter posts based on user's teams and club
  const getFilteredPosts = () => {
    const allPosts = postsResponse?.posts || [];
    
    if (!user || !user.clubId) return allPosts;

    return allPosts.filter((post: any) => {
      // Show club-wide posts (posts with clubId but no teamId)
      if (post.clubId === user.clubId && !post.teamId) return true;
      
      // Show team-specific posts for user's teams
      if (post.teamId) {
        // For coaches, check if they manage the team
        if (user.roles?.includes("coach") && user.teamIds) {
          return user.teamIds.includes(post.teamId);
        }
        // For parents, check if their dependents are on the team
        if (user.roles?.includes("parent") && playersResponse?.players) {
          return playersResponse.players.some((player: any) => player.teamId === post.teamId);
        }
      }
      
      return false;
    });
  };

  const posts = getFilteredPosts();
  const userTeams = teamsResponse?.teams?.filter((team: any) => user?.teamIds?.includes(team.id)) || [];

  // Auto-select first team when modal opens or teams are loaded
  useEffect(() => {
    if (showCreateModal && userTeams.length > 0 && !formData.teamId) {
      setFormData(prev => ({ ...prev, teamId: userTeams[0].id }));
    }
  }, [showCreateModal, userTeams, formData.teamId]);

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
        setFormData({ type: 'announcement', scope: 'team', teamId: '', title: '', content: '' });
        Alert.alert('Success', 'Post created successfully!');
      } else {
        Alert.alert('Error', result.error || 'Failed to create post');
      }
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to create post');
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts-session'] });
      Alert.alert('Success', 'Post deleted successfully!');
      setShowDeleteDialog(false);
      setSelectedPost(null);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to delete post');
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: async (data: { postId: string; updates: any }) => {
      const response = await fetch(`${API_BASE_URL}/api/posts/${data.postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.updates),
        credentials: 'include',
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts-session'] });
      Alert.alert('Success', 'Post updated successfully!');
      setShowEditModal(false);
      setSelectedPost(null);
      setFormData({ type: 'announcement', scope: 'team', teamId: '', title: '', content: '' });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update post');
    },
  });

  const handleCreatePost = () => {
    if (!formData.title || !formData.content) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Validate team selection for team-scoped posts
    if (formData.scope === 'team' && !formData.teamId) {
      Alert.alert('Error', 'Please select a team');
      return;
    }

    createPostMutation.mutate({
      type: formData.type,
      scope: formData.scope,
      teamId: formData.scope === 'team' ? formData.teamId : undefined,
      title: formData.title,
      content: formData.content,
    });
  };

  const handleEditPost = (post: any) => {
    setSelectedPost(post);
    setFormData({
      type: post.type,
      scope: post.teamId ? 'team' : 'club',
      teamId: post.teamId || '',
      title: post.title,
      content: post.content,
    });
    setShowEditModal(true);
  };

  const handleUpdatePost = () => {
    if (!formData.title || !formData.content) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (formData.scope === 'team' && !formData.teamId) {
      Alert.alert('Error', 'Please select a team');
      return;
    }

    updatePostMutation.mutate({
      postId: selectedPost.id,
      updates: {
        type: formData.type,
        teamId: formData.scope === 'team' ? formData.teamId : null,
        clubId: formData.scope === 'club' ? user?.clubId : null,
        title: formData.title,
        content: formData.content,
      },
    });
  };

  const handleDeletePost = (post: any) => {
    setSelectedPost(post);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (selectedPost) {
      deletePostMutation.mutate(selectedPost.id);
    }
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
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Posts</Text>
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
                  <View style={styles.postHeaderRight}>
                    {post.createdAt && (
                      <Text style={styles.postDate}>{formatDate(post.createdAt)}</Text>
                    )}
                    {user && post.authorId === user.id && (
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          onPress={() => handleEditPost(post)}
                          style={styles.actionButton}
                        >
                          <Text style={styles.actionIcon}>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeletePost(post)}
                          style={styles.actionButton}
                        >
                          <Text style={styles.actionIcon}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <ScrollView 
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
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

              {/* Team Selector - only show when scope is 'team' */}
              {formData.scope === 'team' && userTeams.length > 0 && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Select Team</Text>
                  {userTeams.length === 1 ? (
                    <View style={styles.teamInfoBox}>
                      <Text style={styles.teamInfoText}>Team: {userTeams[0].name}</Text>
                    </View>
                  ) : (
                    <View style={styles.teamButtons}>
                      {userTeams.map((team: any) => (
                        <TouchableOpacity
                          key={team.id}
                          style={[
                            styles.teamButton,
                            formData.teamId === team.id && styles.teamButtonActive,
                          ]}
                          onPress={() => setFormData({ ...formData, teamId: team.id })}
                        >
                          <Text style={[
                            styles.teamButtonText,
                            formData.teamId === team.id && styles.teamButtonTextActive,
                          ]}>
                            {team.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}

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
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Post Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <ScrollView 
              style={styles.modalScrollView}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Post</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowEditModal(false);
                    setFormData({ type: 'announcement', scope: 'team', teamId: '', title: '', content: '' });
                  }}
                >
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Type</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={[styles.radioButton, formData.type === 'announcement' && styles.radioButtonActive]}
                    onPress={() => setFormData({ ...formData, type: 'announcement' })}
                  >
                    <Text style={[styles.radioText, formData.type === 'announcement' && styles.radioTextActive]}>
                      Announcement
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.radioButton, formData.type === 'kit_request' && styles.radioButtonActive]}
                    onPress={() => setFormData({ ...formData, type: 'kit_request' })}
                  >
                    <Text style={[styles.radioText, formData.type === 'kit_request' && styles.radioTextActive]}>
                      Kit Request
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.radioButton, formData.type === 'player_request' && styles.radioButtonActive]}
                    onPress={() => setFormData({ ...formData, type: 'player_request' })}
                  >
                    <Text style={[styles.radioText, formData.type === 'player_request' && styles.radioTextActive]}>
                      Player Request
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Scope</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={[styles.radioButton, formData.scope === 'team' && styles.radioButtonActive]}
                    onPress={() => setFormData({ ...formData, scope: 'team' })}
                  >
                    <Text style={[styles.radioText, formData.scope === 'team' && styles.radioTextActive]}>
                      Team
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.radioButton, formData.scope === 'club' && styles.radioButtonActive]}
                    onPress={() => setFormData({ ...formData, scope: 'club' })}
                  >
                    <Text style={[styles.radioText, formData.scope === 'club' && styles.radioTextActive]}>
                      Club-wide
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {formData.scope === 'team' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Team</Text>
                  <View style={styles.pickerWrapper}>
                    {userTeams.map((team: any) => (
                      <TouchableOpacity
                        key={team.id}
                        style={[
                          styles.teamOption,
                          formData.teamId === team.id && styles.teamOptionActive
                        ]}
                        onPress={() => setFormData({ ...formData, teamId: team.id })}
                      >
                        <Text style={[
                          styles.teamOptionText,
                          formData.teamId === team.id && styles.teamOptionTextActive
                        ]}>
                          {team.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

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
                  onPress={() => {
                    setShowEditModal(false);
                    setFormData({ type: 'announcement', scope: 'team', teamId: '', title: '', content: '' });
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleUpdatePost}
                  disabled={updatePostMutation.isPending}
                >
                  <Text style={styles.submitButtonText}>
                    {updatePostMutation.isPending ? 'Updating...' : 'Update Post'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <Modal
        visible={showDeleteDialog}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDeleteDialog(false)}
      >
        <View style={styles.deleteDialogOverlay}>
          <View style={styles.deleteDialogContent}>
            <Text style={styles.deleteDialogTitle}>Delete Post</Text>
            <Text style={styles.deleteDialogMessage}>
              Are you sure you want to delete this post? This action cannot be undone.
            </Text>
            <View style={styles.deleteDialogButtons}>
              <TouchableOpacity
                style={[styles.deleteDialogButton, styles.deleteDialogCancelButton]}
                onPress={() => {
                  setShowDeleteDialog(false);
                  setSelectedPost(null);
                }}
              >
                <Text style={styles.deleteDialogCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteDialogButton, styles.deleteDialogDeleteButton]}
                onPress={confirmDelete}
                disabled={deletePostMutation.isPending}
              >
                <Text style={styles.deleteDialogDeleteText}>
                  {deletePostMutation.isPending ? 'Deleting...' : 'Delete'}
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
  postHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postDate: {
    fontSize: 12,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    padding: 4,
  },
  actionIcon: {
    fontSize: 18,
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
  teamInfoBox: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  teamInfoText: {
    fontSize: 14,
    color: '#333',
  },
  teamButtons: {
    flexDirection: 'column',
    gap: 8,
  },
  teamButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
  },
  teamButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  teamButtonText: {
    fontSize: 14,
    color: '#333',
  },
  teamButtonTextActive: {
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
  deleteDialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteDialogContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  deleteDialogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#111',
  },
  deleteDialogMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  deleteDialogButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteDialogButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteDialogCancelButton: {
    backgroundColor: '#f5f5f5',
  },
  deleteDialogCancelText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
  },
  deleteDialogDeleteButton: {
    backgroundColor: '#FF3B30',
  },
  deleteDialogDeleteText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
