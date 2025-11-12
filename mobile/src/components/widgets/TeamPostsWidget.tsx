import { View, Text, StyleSheet } from 'react-native';
import { WidgetCard } from './WidgetCard';
import { formatDate } from '@/utils/dashboard';

interface TeamPostsWidgetProps {
  posts: any[];
}

export function TeamPostsWidget({ posts }: TeamPostsWidgetProps) {
  return (
    <WidgetCard 
      title="📢 Team Posts" 
      isEmpty={posts.length === 0}
      emptyMessage="No recent posts"
    >
      {posts.map((post: any) => (
        <View key={post.id} style={styles.postItem}>
          <Text style={styles.postTitle}>{post.title}</Text>
          <Text style={styles.postContent} numberOfLines={2}>
            {post.content}
          </Text>
          <Text style={styles.postAuthor}>
            By {post.authorName} • {formatDate(post.createdAt)}
          </Text>
        </View>
      ))}
    </WidgetCard>
  );
}

const styles = StyleSheet.create({
  postItem: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#9c27b0",
  },
  postTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
    color: "#1a1a1a",
  },
  postContent: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 6,
  },
  postAuthor: {
    fontSize: 11,
    color: "#999",
  },
});
