import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { launchImageLibrary } from 'react-native-image-picker';
import { colors } from '../theme/colors';
import Icon from 'react-native-vector-icons/Ionicons';
import { supabaseService } from '../services/SupabaseService';

const CameraScreen = ({ navigation, onClose, initialMode = 'video' }: any) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [cameraType, setCameraType] = useState<'back' | 'front'>('back');
  const device = useCameraDevice(cameraType);
  const cameraRef = useRef<any>(null);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [flash, setFlash] = useState<any>('off');
  const [activeFilter, setActiveFilter] = useState<'normal' | 'beauty' | 'vintage' | 'neon'>('normal');

  // Publication flow states
  const [publishMode, setPublishMode] = useState<'video' | 'story'>(initialMode);
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Request camera and microphone permissions
  useEffect(() => {
    (async () => {
      const cameraStatus = await (Camera as any).requestCameraPermission();
      const microphoneStatus = await (Camera as any).requestMicrophonePermission();
      setHasPermission(cameraStatus === 'granted' && microphoneStatus === 'granted');
    })();
  }, []);

  // Timer for video recording duration
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Toggle video recording
  const handleRecordPress = async () => {
    if (device == null) {
      // Simulation recording mode (for emulators without camera hardware)
      if (isRecording) {
        // End recording simulation
        setIsRecording(false);
        const mockUri = 'file:///simulated/media/streamsky_mock_video.mp4';
        handleMediaCaptured(mockUri);
      } else {
        // Start recording simulation
        setIsRecording(true);
      }
      return;
    }

    if (cameraRef.current == null) return;

    try {
      if (isRecording) {
        setIsRecording(false);
        await cameraRef.current.stopRecording();
      } else {
        setIsRecording(true);
        await cameraRef.current.startRecording({
          flash: flash,
          onRecordingFinished: (video: any) => {
            console.log('Video recording finished:', video);
            handleMediaCaptured(video.path);
          },
          onRecordingError: (error: any) => {
            console.error('Recording error:', error);
            setIsRecording(false);
            Alert.alert('Erreur', "Une erreur est survenue lors de l'enregistrement.");
          },
        });
      }
    } catch (err) {
      console.error('Record press error:', err);
      setIsRecording(false);
    }
  };

  // Open device photo/video library
  const handleOpenGallery = () => {
    launchImageLibrary(
      {
        mediaType: 'video',
        videoQuality: 'high',
      },
      (response) => {
        if (response.didCancel) {
          console.log('User cancelled gallery picker');
        } else if (response.errorMessage) {
          console.error('Gallery Picker Error: ', response.errorMessage);
          Alert.alert('Erreur', 'Impossible de charger la galerie.');
        } else if (response.assets && response.assets.length > 0) {
          const selectedUri = response.assets[0].uri;
          if (selectedUri) {
            handleMediaCaptured(selectedUri);
          }
        }
      }
    );
  };

  // Triggers once a video is recorded or selected from gallery
  const handleMediaCaptured = (uri: string) => {
    setMediaUri(uri);
    setVideoTitle('');
    setUploadModalVisible(true);
  };

  // Submits video/story to Cloudinary + Supabase
  const handlePublish = async () => {
    if (!mediaUri) return;

    try {
      setIsUploading(true);
      
      // 1. Simuler/Effectuer le téléversement vers Cloudinary
      const cloudinaryUrl = await supabaseService.uploadToCloudinarySimulated(mediaUri);

      // 2. Insérer dans Supabase en fonction du mode (Video vs Story)
      if (publishMode === 'story') {
        await supabaseService.publishStory(videoTitle.trim(), cloudinaryUrl);
        Alert.alert('Succès', 'Votre story éphémère a été publiée avec succès ! ✨');
      } else {
        await supabaseService.publishVideo(videoTitle.trim(), cloudinaryUrl);
        Alert.alert('Succès', 'Votre vidéo a été publiée avec succès ! 🚀');
      }

      setUploadModalVisible(false);
      setIsUploading(false);
      setMediaUri(null);

      // Close the camera screen
      if (onClose) {
        onClose();
      } else {
        navigation?.goBack();
      }
    } catch (error: any) {
      setIsUploading(false);
      Alert.alert('Erreur de publication', error.message || "Impossible de se connecter à la base de données.");
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.permissionText}>Demande de permission de la caméra et du micro...</Text>
        <TouchableOpacity style={styles.exitBtn} onPress={() => onClose ? onClose() : navigation?.goBack()}>
          <Text style={styles.exitBtnText}>Fermer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Real camera view finder */}
      {device != null ? (
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          {...{video: true, audio: true} as any}
        />
      ) : (
        // Clean mock camera viewfinder for emulators (ensures no blank screen or crashes)
        <View style={[
          styles.mockViewfinder,
          activeFilter === 'vintage' && { backgroundColor: '#3d2b1f' },
          activeFilter === 'neon' && { backgroundColor: '#051f2e' },
          activeFilter === 'beauty' && { backgroundColor: '#2b1b26' }
        ]}>
          <View style={styles.focusBrackets} />
          <Icon name="videocam" size={80} color="rgba(255, 255, 255, 0.15)" style={styles.watermarkIcon} />
          <Text style={styles.simulationText}>Flux Caméra Native</Text>
          <Text style={styles.filterText}>Filtre : {activeFilter.toUpperCase()}</Text>
        </View>
      )}

      {/* Top Header Control Overlay */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.circleButton}
          onPress={() => onClose ? onClose() : navigation?.goBack()}
        >
          <Icon name="close" size={24} color={colors.white} />
        </TouchableOpacity>

        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.redDot} />
            <Text style={styles.recordingTimer}>{formatTime(seconds)}</Text>
          </View>
        )}

        <View style={{ width: 44 }} />
      </View>

      {/* Right-side overlay adjustments */}
      <View style={styles.rightOverlayControls}>
        <TouchableOpacity
          style={styles.sideControlBtn}
          onPress={() => setCameraType((prev) => (prev === 'back' ? 'front' : 'back'))}
        >
          <Icon name="camera-reverse-outline" size={24} color={colors.white} />
          <Text style={styles.sideControlLabel}>Tourner</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.sideControlBtn}
          onPress={() => setFlash((prev: any) => (prev === 'off' ? 'on' : 'off'))}
        >
          <Icon name={flash === 'on' ? 'flash' : 'flash-off-outline'} size={24} color={flash === 'on' ? '#FFCC00' : colors.white} />
          <Text style={styles.sideControlLabel}>Flash</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sideControlBtn}
          onPress={() => {
            const filters: ('normal' | 'beauty' | 'vintage' | 'neon')[] = ['normal', 'beauty', 'vintage', 'neon'];
            const nextIdx = (filters.indexOf(activeFilter) + 1) % filters.length;
            setActiveFilter(filters[nextIdx]);
          }}
        >
          <Icon name="color-filter-outline" size={24} color={colors.white} />
          <Text style={styles.sideControlLabel}>Filtres</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Controls Panel */}
      <View style={styles.bottomControls}>
        {/* Mode selection tabs */}
        <View style={styles.modeTabs}>
          <TouchableOpacity
            style={[styles.modeTab, publishMode === 'video' && styles.modeTabActive]}
            onPress={() => setPublishMode('video')}
          >
            <Text style={[styles.modeTabText, publishMode === 'video' && styles.modeTabTextActive]}>
              VIDÉO
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, publishMode === 'story' && styles.modeTabActive]}
            onPress={() => setPublishMode('story')}
          >
            <Text style={[styles.modeTabText, publishMode === 'story' && styles.modeTabTextActive]}>
              STORY
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionRow}>
          {/* Gallery Picker (Bottom Left) */}
          <TouchableOpacity style={styles.galleryButton} onPress={handleOpenGallery}>
            <View style={styles.galleryIconWrapper}>
              <Icon name="image-outline" size={26} color={colors.white} />
            </View>
            <Text style={styles.galleryLabel}>Galerie</Text>
          </TouchableOpacity>

          {/* Central Capture/Record Trigger */}
          <TouchableOpacity style={styles.captureButtonOuter} onPress={handleRecordPress}>
            <View style={[
              styles.captureButtonInner,
              isRecording && styles.captureButtonRecording,
              publishMode === 'story' && { backgroundColor: colors.secondary }
            ]} />
          </TouchableOpacity>

          {/* Place holder for balance */}
          <View style={{ width: 60, alignItems: 'center' }} />
        </View>

        <Text style={styles.recordInstruction}>
          {isRecording ? "Appuyez pour arrêter l'enregistrement" : `Mode ${publishMode.toUpperCase()} actif. Appuyez pour capturer.`}
        </Text>
      </View>

      {/* Publication Form Modal */}
      <Modal
        visible={uploadModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Publier {publishMode === 'story' ? 'une Story 🎬' : 'une Vidéo 🚀'}
            </Text>
            
            <Text style={styles.modalSub}>
              Saisissez une description ou un titre avant de publier sur StreamSky.
            </Text>

            <TextInput
              style={styles.textInput}
              value={videoTitle}
              onChangeText={setVideoTitle}
              placeholder={publishMode === 'story' ? "Légende de la story..." : "Titre ou tags de la vidéo..."}
              placeholderTextColor="rgba(255,255,255,0.4)"
              multiline={true}
              numberOfLines={3}
              maxLength={120}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => {
                  setUploadModalVisible(false);
                  setMediaUri(null);
                }}
                disabled={isUploading}
              >
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.publishBtn]}
                onPress={handlePublish}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.publishBtnText}>Publier</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    color: colors.white,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 40,
  },
  exitBtn: {
    marginTop: 30,
    backgroundColor: colors.surface,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  exitBtnText: {
    color: colors.white,
    fontWeight: '700',
  },
  topHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100,
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightOverlayControls: {
    position: 'absolute',
    right: 20,
    top: Platform.OS === 'ios' ? 100 : 70,
    gap: 20,
    zIndex: 10,
  },
  sideControlBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
  },
  sideControlLabel: {
    color: colors.white,
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bottomControls: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 4,
    marginBottom: 20,
  },
  modeTab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modeTabActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  modeTabText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  modeTabTextActive: {
    color: colors.white,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '80%',
    marginBottom: 16,
  },
  galleryButton: {
    alignItems: 'center',
    width: 60,
  },
  galleryIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  galleryLabel: {
    color: colors.white,
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  captureButtonOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
  },
  captureButtonRecording: {
    backgroundColor: colors.error,
    transform: [{ scale: 0.7 }],
    borderRadius: 8,
  },
  recordInstruction: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  mockViewfinder: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#1E152E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusBrackets: {
    width: 200,
    height: 200,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    position: 'absolute',
  },
  watermarkIcon: {
    marginBottom: 16,
  },
  simulationText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  filterText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    fontWeight: '600',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    marginRight: 6,
  },
  recordingTimer: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  // Upload modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#1E152E',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSub: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 18,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    height: 80,
    paddingHorizontal: 16,
    paddingTop: 12,
    color: colors.white,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cancelBtnText: {
    color: colors.white,
    fontWeight: '600',
  },
  publishBtn: {
    backgroundColor: colors.primary,
  },
  publishBtnText: {
    color: colors.black,
    fontWeight: '700',
  },
});

export default CameraScreen;
