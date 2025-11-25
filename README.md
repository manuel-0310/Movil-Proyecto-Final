# 📱 **MyVet — Veterinary Assistant App**

MyVet es una aplicación móvil desarrollada con **Expo** que ayuda a los dueños de mascotas a llevar control de su información, acceder a un **chat veterinario con IA**, crear **QRs de identificación**, y recibir **notificaciones inteligentes** generadas por inteligencia artificial.

---

## 🟣 **Repositorio del Proyecto**

Este repositorio contiene toda la documentación del proyecto, incluyendo:

- Arquitectura del proyecto  
- Estructura completa de carpetas  
- Especificaciones técnicas  
- Integraciones de APIs  
- Código fuente  
- Media (capturas, videos y pruebas)  

---

# 📁 **Arquitectura y Estructura del Proyecto**

La app está organizada de forma modular usando **Expo Router**, lo que permite una navegación clara y escalable.  
Estructura basada en la organización actual del proyecto:
```
MyVet/
│
├── app/                          # Carpeta principal de navegación (Expo Router)
│   ├── (auth)/                   # Rutas de autenticación
│   │   ├── _layout.tsx           # Layout base para las pantallas de login/register
│   │   ├── login.tsx             # Pantalla de inicio de sesión
│   │   ├── register.tsx          # Pantalla de registro con selección de ciudad
│   │   ├── reset.tsx             # Pantalla para restablecer contraseña
│   │
│   ├── (tabs)/                   # Navegación principal (Home, Chats, Market, Perfil)
│   │   ├── _layout.tsx           # Layout de tabs
│   │   ├── home.tsx              # Pantalla principal
│   │
│   │   ├── chats/                # Chat veterinario con IA
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx         # Lista de chats
│   │   │   ├── [id].tsx          # Conversación individual
│   │
│   │   ├── market/
│   │   │   ├── index.tsx         # Marketplace
│   │   │   ├── map.tsx           # Mapa de aliados
│   │   │   ├── store.tsx         # Vista de una tienda aliada
│   │
│   │   ├── profile.tsx           # Perfil del usuario, mascotas y botón Premium
│   │
│   ├── add-pet/
│   │   └── index.tsx             # Formulario para crear nueva mascota
│   │
│   ├── onboarding/
│   │   ├── index.tsx             # Pantalla inicial onboarding
│   │   └── first-pet.tsx         # Registrar primera mascota
│   │
│   ├── qr/                       # Funciones relacionadas a códigos QR
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # Lista de QRs generados
│   │   ├── create.tsx            # Crear QR
│   │   ├── scan.tsx              # Escanear un QR
│   │   └── pet-info/
│   │       └── [id].tsx          # Información pública de la mascota (cuando alguien escanea)
│
│   ├── add-vaccine.tsx           # Registrar vacuna 
│   ├── add-medical-record.tsx    # Registrar historial médico o citas
│
├── assets/
│   ├── icons/                    # Iconos personalizados
│   └── images/                   # Imágenes de la app
│
├── components/
│   ├── EditMedicalRecordModal.tsx
│   ├── EditPetModal.tsx
│   ├── EditProfileModal.tsx
│   ├── EditVaccineModal.tsx
│   ├── QRModal.tsx
│   └── PremiumModal.tsx
│
├── contexts/
│   ├── AuthContext.tsx           # Manejo global de autenticación
│   └── OnboardingContext.tsx     # Control de onboarding
│
├── utils/
│   ├── aiNotifications.ts        # Notificaciones inteligentes con IA
│   ├── openai.ts                 # Configuración del modelo OpenAI
│   └── supabase.ts               # Conexión a Supabase
│
└── package.json                  # Dependencias y scripts

```
---

# 🟣 **Tecnologías Utilizadas**

## **🔐 Supabase**
- Autenticación de usuarios  
- Base de datos en tiempo real  
- Almacenamiento de imágenes (Supabase Storage)  }

---

## 🤖 **OpenAI**
- Chat veterinario con IA  
- Notificaciones inteligentes generadas automáticamente  

---

## 🌍 **APIs y Librerías Externas**
- **TheDogAPI** → Razas de perros  
- **TheCatAPI** → Razas de gatos  
- **API de ciudades de Colombia** → Autocompletado en registro  
- **Expo Notifications** → Notificaciones locales + alertas QR  
- **Expo ImagePicker** → Selección y captura de imágenes  
- **Expo Router** → Navegación modular  
- **React Native Reanimated** → Animaciones fluidas  

---

# 🛠️ **Funciones Principales**

### ✔ Registro y autenticación de usuarios  
### ✔ Registro de mascotas  
### ✔ Chat veterinario con IA  
### ✔ Sistema de notificaciones automáticas  
### ✔ Códigos QR inteligentes  
### ✔ Market con tiendas y veterinarias  
### ✔ Perfil editable (usuario y mascota)  
### ✔ Modales dinámicos (vacunas, historial médico, premium)

---

# 💼 **Business Model**

### 🟣 Free
- 2 chats diarios  
- 2 mascotas máximo  
- Con anuncios  
- Sin envío de imágenes en chat  
- No puede crear QR

### 🟡 Premium
- Chats ilimitados  
- Mascotas ilimitadas  
- Envío de imágenes al chat IA  
- Crear y administrar QR  
- Notificaciones personalizadas  
- Sin anuncios

### 🧩 Alianzas de mercado
MyVet proyecta asociarse con:
- Clínicas veterinarias  
- Tiendas de mascotas  
- Groomings locales  
Para promocionar productos, servicios y ubicaciones dentro de la app.

---



