import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/config';

export default function Posts() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ['/api/posts'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/posts`, {
        credentials: 'include',
      });
      return response.json();
    },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Posts & Announcements</Text>
        {isLoading ? (
          <Text>Loading posts...</Text>
        ) : (
          <View style={styles.postsContainer}>
            {posts?.length > 0 ? (
              posts.map((post: any) => (
                <View key={post.id} style={styles.postCard}>
                  <Text style={styles.postTitle}>{post.title}</Text>
                  <Text style={styles.postContent}>{post.content}</Text>
                  <Text style={styles.postCategory}>{post.category}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No posts yet</Text>
            )}
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
  postsContainer: {
    gap: 15,
  },
  postCard: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  postCategory: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
});
