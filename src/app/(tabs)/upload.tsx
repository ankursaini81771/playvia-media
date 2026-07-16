import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Film, Image as ImageIcon, Check, Video } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../../theme/colors';
import { useUpload } from '../../hooks/useUpload';



const CATEGORIES = ['Gaming', 'Music', 'Tech', 'Vlogs', 'Comedy'];

// Seed options to make testing instant and fun!
const PRESET_VIDEOS = [
  {
    name: 'Big Buck Bunny (Tech/Gaming)',
    video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&auto=format&fit=crop',
    type: 'video' as const,
    category: 'Tech',
  },
  {
    name: 'Neon Futuristic City (Short)',
    video: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-in-a-futuristic-city-38999-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&auto=format&fit=crop',
    type: 'short' as const,
    category: 'Gaming',
  },
  {
    name: 'Waterfall Wilderness (Short)',
    video: 'https://assets.mixkit.co/videos/preview/mixkit-vertical-video-of-a-beautiful-waterfall-in-a-forest-43015-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=600&auto=format&fit=crop',
    type: 'short' as const,
    category: 'Vlogs',
  }
];

export default function UploadScreen() {
  const router = useRouter();
  const { uploadVideo, uploading, progress } = useUpload();
  const insets = useSafeAreaInsets();

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Tech');
  const [tagsInput, setTagsInput] = useState('');
  const [type, setType] = useState<'video' | 'short'>('video');
  
  // Selected video files states
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number | null>(null);

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need gallery permission to select a video.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setVideoUrl(result.assets[0].uri);
      setSelectedPresetIndex(null);
    }
  };

  const pickThumbnail = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need gallery permission to select an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setThumbnailUrl(result.assets[0].uri);
      setSelectedPresetIndex(null);
    }
  };

  const selectPreset = (index: number) => {
    const preset = PRESET_VIDEOS[index];
    setVideoUrl(preset.video);
    setThumbnailUrl(preset.thumbnail);
    setType(preset.type);
    setCategory(preset.category);
    setSelectedPresetIndex(index);
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title.');
      return;
    }

    if (!videoUrl.trim() || !thumbnailUrl.trim()) {
      Alert.alert('Error', 'Please configure your video and thumbnail sources.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const { data, error } = await uploadVideo(videoUrl, thumbnailUrl, {
      title: title.trim(),
      description: description.trim(),
      category,
      tags,
      type,
    });

    if (error) {
      Alert.alert('Upload Failed', error.message);
    } else {
      Alert.alert('Success', 'Video published successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Reset fields
            setTitle('');
            setDescription('');
            setTagsInput('');
            setVideoUrl('');
            setThumbnailUrl('');
            setSelectedPresetIndex(null);
            
            // Navigate back
            router.replace('/(tabs)');
          },
        },
      ]);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.contentContainer, { paddingTop: (insets.top || 20) + 10 }]}>
      <Text style={styles.screenTitle}>Create Video</Text>
      
      {uploading ? (
        <View style={styles.progressContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginBottom: 12 }} />
          <Text style={styles.progressLabel}>Publishing your content...</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressPercentage}>{progress}%</Text>
        </View>
      ) : (
        <View style={styles.form}>
          {/* Quick Seeder Presets */}
          <Text style={styles.sectionLabel}>1. Select Sample Preset Video (For Quick Testing)</Text>
          <View style={styles.presetsGrid}>
            {PRESET_VIDEOS.map((preset, idx) => {
              const isSelected = selectedPresetIndex === idx;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.presetCard, isSelected && styles.presetCardSelected]}
                  onPress={() => selectPreset(idx)}
                >
                  <View style={styles.presetIndicator}>
                    {preset.type === 'short' ? <Film size={14} color="#FFF" /> : <Video size={14} color="#FFF" />}
                    {isSelected && <Check size={14} color={COLORS.success} style={{ marginLeft: 6 }} />}
                  </View>
                  <Text style={styles.presetText} numberOfLines={1}>
                    {preset.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom URL & Gallery Options */}
          <Text style={styles.sectionLabel}>Or Upload / Paste Media</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.urlLabel}>Video Source (MP4 URL, YouTube Link, or Select File):</Text>
            <TextInput
              value={videoUrl}
              onChangeText={(text) => {
                setVideoUrl(text);
                setSelectedPresetIndex(null);
              }}
              placeholder="Paste link or tap select file button below"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.urlInput}
            />
            <View style={styles.galleryRow}>
              <TouchableOpacity style={styles.galleryButton} onPress={pickVideo}>
                <Text style={styles.galleryButtonText}>📂 Select Video from Gallery</Text>
              </TouchableOpacity>
            </View>
            {videoUrl && videoUrl.startsWith('file://') ? (
              <View style={styles.previewContainer}>
                <Text style={styles.previewPlaceholder} numberOfLines={1}>
                  🎥 Selected Video Uri: {videoUrl.split('/').pop()}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.urlLabel}>Thumbnail Image (Image URL or Select File):</Text>
            <TextInput
              value={thumbnailUrl}
              onChangeText={(text) => {
                setThumbnailUrl(text);
                setSelectedPresetIndex(null);
              }}
              placeholder="Paste image link or tap select file below"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.urlInput}
            />
            <View style={styles.galleryRow}>
              <TouchableOpacity style={styles.galleryButton} onPress={pickThumbnail}>
                <Text style={styles.galleryButtonText}>📂 Select Image from Gallery</Text>
              </TouchableOpacity>
            </View>
            {thumbnailUrl ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: thumbnailUrl }} style={styles.previewImage} resizeMode="cover" />
              </View>
            ) : null}
          </View>

          {/* Video Metadata Form */}
          <Text style={styles.sectionLabel}>2. Add Details</Text>
          
          <View style={styles.textInputContainer}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Title (required)"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.textInput}
              maxLength={100}
            />
          </View>

          <View style={[styles.textInputContainer, { height: 100, alignItems: 'flex-start' }]}>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Description"
              placeholderTextColor={COLORS.textSecondary}
              style={[styles.textInput, { height: '100%', textAlignVertical: 'top', paddingTop: 10 }]}
              multiline
              maxLength={500}
            />
          </View>

          {/* Video Type Selector */}
          <Text style={styles.sectionLabel}>3. Select Layout Style</Text>
          <View style={styles.typeSelectorRow}>
            <TouchableOpacity
              style={[styles.typeButton, type === 'video' && styles.typeButtonSelected]}
              onPress={() => {
                setType('video');
                setSelectedPresetIndex(null);
              }}
            >
              <Video size={16} color={type === 'video' ? COLORS.black : COLORS.white} style={{ marginRight: 6 }} />
              <Text style={[styles.typeButtonText, type === 'video' && styles.typeButtonTextSelected]}>
                Regular Video (16:9)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeButton, type === 'short' && styles.typeButtonSelected]}
              onPress={() => {
                setType('short');
                setSelectedPresetIndex(null);
              }}
            >
              <Film size={16} color={type === 'short' ? COLORS.black : COLORS.white} style={{ marginRight: 6 }} />
              <Text style={[styles.typeButtonText, type === 'short' && styles.typeButtonTextSelected]}>
                Vertical Short (9:16)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Category Chip Selector */}
          <Text style={styles.sectionLabel}>4. Select Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroller}>
            {CATEGORIES.map((cat) => {
              const isSelected = cat === category;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, isSelected && styles.catChipSelected]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.catChipText, isSelected && styles.catChipTextSelected]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Tags */}
          <View style={styles.textInputContainer}>
            <TextInput
              value={tagsInput}
              onChangeText={setTagsInput}
              placeholder="Tags (comma-separated, e.g. gaming, ps5, cod)"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.textInput}
            />
          </View>

          <TouchableOpacity style={styles.publishButton} onPress={handleUpload}>
            <Text style={styles.publishButtonText}>Publish Content</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 18,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  form: {
    width: '100%',
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  presetCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  presetCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255, 43, 66, 0.05)',
  },
  presetIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  presetText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '500',
  },
  inputWrapper: {
    marginBottom: 12,
  },
  urlLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  urlInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: COLORS.white,
    fontSize: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textInputContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textInput: {
    color: COLORS.white,
    fontSize: 13,
    width: '100%',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    height: 40,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  typeButtonSelected: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.white,
  },
  typeButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  typeButtonTextSelected: {
    color: COLORS.black,
  },
  categoryScroller: {
    marginBottom: 16,
  },
  catChip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  catChipText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '500',
  },
  catChipTextSelected: {
    color: COLORS.black,
    fontWeight: 'bold',
  },
  publishButton: {
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  publishButtonText: {
    color: COLORS.black,
    fontWeight: 'bold',
    fontSize: 14,
  },
  progressContainer: {
    backgroundColor: COLORS.surface,
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 40,
  },
  progressLabel: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.background,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  progressPercentage: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  galleryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  galleryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  galleryButtonText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
  },
  previewContainer: {
    marginTop: 8,
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewPlaceholder: {
    color: COLORS.textSecondary,
    fontSize: 11,
    paddingHorizontal: 10,
  },
});
