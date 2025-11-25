import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';

export default function BrandButton({ title, onPress }) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2867a8',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 12,
    marginVertical: 10,
    alignItems: 'center',
  },
  text: {
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
    color: '#83dadd',
    fontWeight: '600',
    fontSize:Platform.select({ ios: 15, default: 18 }),
  },
});
