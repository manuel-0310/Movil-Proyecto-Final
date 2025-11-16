import { useOnboarding } from '@/contexts/OnboardingContext';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { TouchableOpacity, View, Text } from 'react-native';
export default function Home() {

  const { resetOnboarding } = useOnboarding();
  const { logout } = useContext(AuthContext);

  const handleResetOnboarding = async () => {
    await logout(); // Cierra sesión
    await resetOnboarding(); // Resetea onboarding
    // No necesitas hacer nada más, el index.tsx se encargará
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Tu contenido normal aquí */}
      
      {/* Botón de desarrollo - Quitar en producción */}
      <TouchableOpacity 
        onPress={handleResetOnboarding}
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          backgroundColor: '#FF6B6B',
          padding: 15,
          borderRadius: 10,
          zIndex: 999,
          elevation: 5,
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          🔄 Reset Onboarding
        </Text>
      </TouchableOpacity>
    </View>
  );
}