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
  PermissionsAndroid,
  Linking,
} from 'react-native';
import { Camera, useCameraDevice, VisionCamera } from 'react-native-vision-camera';
import { launchImageLibrary } from 'react-native-image-picker';
import { colors } from '../theme/colors';
import Icon from 'react-native-vector-icons/Ionicons';
import { supabaseService } from '../services/SupabaseService';
import { uploadVideoToCloudinary } from '../services/CloudinaryService';
import { useAuth } from '../context/AuthContext';

const CameraScreen = ({ navigation, onClose, initialMode = 'video' }: any) => {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null); // null = loading, false = denied, true = granted
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
      try {
        const cameraStatus = await VisionCamera.requestCameraPermission();
        const microphoneStatus = await VisionCamera.requestMicrophonePermission();
        setHasPermission(cameraStatus && microphoneStatus);
      } catch (err) {
        console.error('Error requesting permissions:', err);
        setHasPermission(false);
      }
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

  // Request gallery permission (Android only)
  const requestGalleryPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true; // iOS handles permissions natively via launchImageLibrary
    }

    const androidVersion = parseInt(String(Platform.Version), 10);
    if (androidVersion >= 33) {
      // Android 13+ (SDK 33+) handles gallery access via the system Photo Picker,
      // which does not require runtime storage permissions.
      return true;
    }

    try {
      // Android 12 and below requires READ_EXTERNAL_STORAGE
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: 'Accès à la galerie',
          message: 'StreamSky a besoin d\'accéder à votre galerie pour publier des photos et vidéos.',
          buttonPositive: 'Autoriser',
          buttonNegative: 'Refuser',
        }
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.error('Gallery permission error:', error);
      return false;
    }
  };

  // Open device photo/video library
  const handleOpenGallery = async () => {
    const hasGalleryPermission = await requestGalleryPermission();

    if (!hasGalleryPermission) {
      Alert.alert(
        'Permission refusée',
        'StreamSky n\'a pas accès à votre galerie. Allez dans Paramètres → Applications → StreamSky → Autorisations pour l\'activer.',
        [{ text: 'OK' }]
      );
      return;
    }

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
      
      // 1. Téléverser la vidéo vers Cloudinary (unsigned upload avec repli HLS automatique)
      const cloudinaryUrl = await uploadVideoToCloudinary(mediaUri);

      // 2. Insérer dans Supabase en fonction du mode (Video vs Story)
      // On passe le nom et la photo de l'utilisateur pour qu'ils apparaissent dans le feed
      const displayName = user?.displayName || null;
      const photoUrl = user?.photoURL || null;

      if (publishMode === 'story') {
        await supabaseService.publishStory(videoTitle.trim(), cloudinaryUrl);
        Alert.alert('Succès', 'Votre story éphémère a été publiée avec succès ! ✨');
      } else {
        await supabaseService.publishVideo(videoTitle.trim(), cloudinaryUrl, displayName, photoUrl);
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

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.permissionText}>Vérification des permissions caméra et micro...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Icon name="videocam-off" size={64} color="rgba(255, 255, 255, 0.3)" style={{ marginBottom: 12 }} />
        <Text style={styles.permissionTitle}>Permissions Requises 🎬</Text>
        <Text style={styles.permissionText}>
          StreamSky a besoin d'accéder à l'appareil photo et au microphone pour vous permettre de capturer des vidéos et publier du contenu.
        </Text>
        
        <TouchableOpacity style={styles.settingsBtn} onPress={() => Linking.openSettings()}>
          <Text style={styles.settingsBtnText}>Ouvrir les Paramètres</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.galleryFallbackBtn} 
          onPress={handleOpenGallery}
        >
          <Text style={styles.galleryFallbackText}>Sélectionner depuis la Galerie</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.exitBtn} onPress={() => onClose ? onClose() : navigation?.goBack()}>
          <Text style={styles.exitBtnText}>Annuler</Text>
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
  permissionTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  settingsBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
    width: '70%',
    alignItems: 'center',
  },
  settingsBtnText: {
    color: colors.black,
    fontWeight: '700',
    fontSize: 14,
  },
  galleryFallbackBtn: {
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1.5,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 12,
    width: '70%',
    alignItems: 'center',
  },
  galleryFallbackText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
});

export default CameraScreen;
