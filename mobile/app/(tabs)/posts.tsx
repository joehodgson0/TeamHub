import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE_URL } from '@/lib/config';

export default function Posts() {
  const { user } = useAuth();

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
        <Text style={styles.title}>Posts & Announcements</Text>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
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
});
