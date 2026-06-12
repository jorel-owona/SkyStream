import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { colors } from '../theme/colors';
import Icon from 'react-native-vector-icons/Ionicons';

const CameraScreen = ({ navigation, onClose }: any) => {
  const [hasPermission, setHasPermission] = useState(false);
  const device = useCameraDevice('back');

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    })();
  }, []);

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Demande de permission de la caméra...</Text>
      </View>
    );
  }

  // State for simulated camera
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [flash, setFlash] = useState(false);
  const [cameraType, setCameraType] = useState<'back' | 'front'>('back');
  const [activeFilter, setActiveFilter] = useState<'normal' | 'beauty' | 'vintage' | 'neon'>('normal');

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

  const handleRecordPress = () => {
    setIsRecording(!isRecording);
  };

  if (device == null) {
    // Simulated Camera Viewfinder for emulators and devices without physical cameras
    return (
      <View style={styles.container}>
        {/* Mock Viewfinder background */}
        <View style={[
          styles.mockViewfinder, 
          activeFilter === 'vintage' && { backgroundColor: '#3d2b1f' },
          activeFilter === 'neon' && { backgroundColor: '#051f2e' },
          activeFilter === 'beauty' && { backgroundColor: '#2b1b26' }
        ]}>
          <View style={styles.focusBrackets} />
          
          <Icon name="videocam" size={80} color="rgba(255, 255, 255, 0.15)" style={styles.watermarkIcon} />
          <Text style={styles.simulationText}>Simulateur de Caméra ({cameraType === 'back' ? 'Arrière' : 'Avant'})</Text>
          <Text style={styles.filterText}>Filtre actif : {activeFilter.toUpperCase()}</Text>
          
          {isRecording && (
            <View style={styles.recordingIndicator}>
              <View style={styles.redDot} />
              <Text style={styles.recordingTimer}>{formatTime(seconds)}</Text>
            </View>
          )}
        </View>

        {/* Top controls overlay */}
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => onClose ? onClose() : navigation?.goBack()}
        >
          <Icon name="close" size={24} color={colors.white} />
        </TouchableOpacity>

        <View style={styles.rightOverlayControls}>
          <TouchableOpacity style={styles.sideControlBtn} onPress={() => setCameraType(prev => prev === 'back' ? 'front' : 'back')}>
            <Icon name="camera-reverse-outline" size={24} color={colors.white} />
            <Text style={styles.sideControlLabel}>Tourner</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sideControlBtn} onPress={() => setFlash(!flash)}>
            <Icon name={flash ? "flash" : "flash-off-outline"} size={24} color={flash ? "#FFCC00" : colors.white} />
            <Text style={styles.sideControlLabel}>Flash</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sideControlBtn} onPress={() => {
            const filters: ('normal' | 'beauty' | 'vintage' | 'neon')[] = ['normal', 'beauty', 'vintage', 'neon'];
            const nextIdx = (filters.indexOf(activeFilter) + 1) % filters.length;
            setActiveFilter(filters[nextIdx]);
          }}>
            <Icon name="color-filter-outline" size={24} color={colors.white} />
            <Text style={styles.sideControlLabel}>Filtres</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity style={styles.captureButtonOuter} onPress={handleRecordPress}>
            <View style={[styles.captureButtonInner, isRecording && styles.captureButtonRecording]} />
          </TouchableOpacity>
          <Text style={styles.recordInstruction}>
            {isRecording ? "Appuyez pour arrêter l'enregistrement" : "Appuyez pour enregistrer sur StreamSky"}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
      />
      
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={() => onClose ? onClose() : navigation?.goBack()}
      >
        <Icon name="close" size={24} color={colors.white} />
      </TouchableOpacity>

      <View style={styles.bottomControls}>
        <View style={styles.captureButtonOuter}>
          <View style={styles.captureButtonInner} />
        </View>
      </View>
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
  text: {
    color: colors.white,
    fontSize: 18,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    zIndex: 10,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
  captureButtonOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.secondary,
  },
  captureButtonRecording: {
    backgroundColor: colors.error,
    transform: [{ scale: 0.8 }],
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1E152E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusBrackets: {
    width: 200,
    height: 200,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    position: 'absolute',
  },
  watermarkIcon: {
    marginBottom: 16,
  },
  simulationText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  filterText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    fontWeight: '600',
  },
  recordingIndicator: {
    position: 'absolute',
    top: 56,
    alignSelf: 'center',
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
  rightOverlayControls: {
    position: 'absolute',
    right: 20,
    top: 60,
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
});

export default CameraScreen;
