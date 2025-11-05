# **PetDoc 24/7**

## 🧠 **Idea de aplicación**

**PetDoc 24/7** es un veterinario virtual con IA que analiza síntomas de mascotas, clasifica el nivel de urgencia y ofrece orientación inmediata.  
También permite conectar con veterinarios reales por videollamada, llevar un historial médico digital, recibir recordatorios de vacunas y usar un **código QR** en el collar del animal para emergencias, brindando tranquilidad a los dueños.

---

## 🎯 **Objetivo**

Brindar una respuesta confiable y rápida a los dueños de mascotas mediante un analizador de síntomas basado en inteligencia artificial, conectando la experiencia digital con servicios veterinarios reales y ofreciendo un espacio de compra de productos especializados.

---

## ✅ **Criterios de éxito**

- El diagnóstico generado por la IA debe mostrarse en menos de **5 segundos** en el 95 % de los casos.  
- El sistema debe enviar recordatorios automáticos de vacunación **24 horas antes** de la fecha programada.  
- En casos graves, el sistema debe recomendar una veterinaria aliada dentro de un **radio de 5 km**.  
- El marketplace debe mostrar correctamente los productos ofrecidos por las veterinarias asociadas y permitir realizar pedidos en línea.

---

## 👥 **Historias de usuario**

- Como **dueño de mascota**, quiero describir los síntomas de mi animal y recibir una evaluación instantánea basada en IA, para saber si necesito atención veterinaria urgente o se puede manejar desde casa.  
- Como **dueño de mascota**, quiero recibir recomendaciones de clínicas veterinarias aliadas cercanas cuando el caso sea grave, para poder actuar rápidamente.  
- Como **veterinaria aliada**, quiero registrar mi establecimiento y mis productos en la plataforma, para que los usuarios puedan encontrarlos y comprarlos a través del marketplace.  
- Como **usuario**, quiero acceder a un marketplace con productos veterinarios recomendados, para adquirir lo que mi mascota necesita sin salir de la aplicación.

---

## ⚙️ **Requisitos funcionales**

- La aplicación debe permitir a los usuarios registrarse e iniciar sesión de forma segura.  
- El sistema debe permitir analizar síntomas ingresados por texto.  
- La aplicación debe clasificar el nivel de urgencia.  
- En casos de urgencia alta, el sistema debe recomendar veterinarias aliadas cercanas según la ubicación del usuario.  
- El sistema debe guardar y actualizar el historial médico de cada mascota.  
- La aplicación debe generar **códigos QR** vinculados al perfil de cada mascota.  
- La aplicación debe incluir un **marketplace** con productos de veterinarias asociadas (alimentos, medicamentos, accesorios, etc.).  
- El sistema debe enviar **notificaciones push** para recordar vacunas, citas o promociones.  
- Las veterinarias aliadas deben poder registrar su información, servicios y catálogo de productos.

---

## 🔒 **Requisitos no funcionales**

- La aplicación debe operar de forma continua (**24/7**) con una disponibilidad del **99 %**.  
- El tiempo promedio de respuesta de la IA no debe superar los **5 segundos**.  
- La aplicación debe ser compatible con **iOS**, **Android** y **Web** (para acceder a la información del QR).  
- El sistema debe ser **escalable** para integrar nuevos servicios y funcionalidades.  
- Las funciones del marketplace deben estar **optimizadas** para una carga rápida y segura.

---

## ⚠️ **Riesgos**

- Vulnerabilidad y filtración de datos debido al manejo de información personal y médica.  
- Dependencia de servicios externos (APIs de IA, servidores en la nube).  
- Problemas de cumplimiento legal o de confidencialidad.  
- Posible mal uso del análisis de síntomas por parte de los usuarios.

---

## 🚫 **Restricciones**

- Presupuesto limitado, por lo que se deben usar servicios gratuitos o de bajo costo.  
- Se requiere **conexión a internet** para las funciones de IA, videollamadas, marketplace y sincronización de datos.

---

## 🖥️ **Arquitectura: Client–Server Model**

**PetDoc 24/7** utiliza una arquitectura cliente–servidor para ofrecer una experiencia fluida, escalable y en tiempo real.

### **Cliente (Frontend)**
- Desarrollado con **Expo (React Native)**.  
- Gestiona la interfaz de usuario, entrada de datos, navegación del marketplace, notificaciones y experiencia general del usuario.

### **Servidor (Backend)**
- Gestionado por **Supabase**, que ofrece autenticación, almacenamiento, base de datos relacional (**PostgreSQL**) y suscripción en tiempo real.  
- Permite sincronizar instantáneamente los datos entre usuario y servidor.

### **Módulo de Inteligencia Artificial**
- Se conecta a una **API externa de IA** que analiza los síntomas y devuelve la clasificación del nivel de urgencia.

---

## 🔄 **Ejemplo de flujo**

1. El usuario describe los síntomas de su mascota en la aplicación.  
2. El cliente envía la información al servidor.  
3. El servidor procesa los datos y los envía al servicio de IA.  
4. La IA devuelve el diagnóstico y la clasificación del nivel de urgencia.  
5. El servidor almacena el resultado en la base de datos y lo envía al cliente.  
6. La aplicación muestra la información al usuario.  
7. Todas las interacciones se registran en el **historial médico** del animal.

---

figma: https://www.figma.com/proto/F7BhaSTQGOeAWDWo2GYCt0/Untitled?node-id=1-4&t=alggLPGFDtNQpLVI-0&scaling=scale-down&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=1%3A4

