// js/auth.js

import { auth } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

// Verifica el estado de autenticación en todas las páginas
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('Usuario autenticado:', user.email);
        // Si el usuario está en la página de login o registro, redirigir a index.html
        const currentPage = window.location.pathname.split("/").pop();
        if (currentPage === 'login.html' || currentPage === 'register.html') {
            window.location.href = 'index.html';
        }
    } else {
        console.log('Usuario no autenticado');
        // Si el usuario no está en la página de login o registro, redirigir a login.html
        const currentPage = window.location.pathname.split("/").pop();
        if (currentPage !== 'login.html' && currentPage !== 'register.html') {
            window.location.href = 'login.html';
        }
    }
});

// Manejo del Formulario de Registro
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = registerForm.email.value.trim();
        const password = registerForm.password.value.trim();

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log('Usuario registrado:', userCredential.user);
            // Redirigir a la página principal después del registro
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error en registro:', error);
            alert('Error en registro: ' + error.message);
        }
    });
}

// Manejo del Formulario de Inicio de Sesión
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginForm.email.value.trim();
        const password = loginForm.password.value.trim();

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('Usuario iniciado sesión:', userCredential.user);
            // Redirigir a la página principal después del inicio de sesión
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error en inicio de sesión:', error);
            alert('Error en inicio de sesión: ' + error.message);
        }
    });
}

// Manejo del Botón de Cierre de Sesión
const logoutButton = document.getElementById('logout');
if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
        try {
            await signOut(auth);
            console.log('Usuario cerrado sesión');
            // Redirigir a la página de inicio de sesión después del cierre de sesión
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            alert('Error al cerrar sesión: ' + error.message);
        }
    });
}
