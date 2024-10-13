// js/app.js

import { auth, db } from './firebase-config.js';
import { 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    where, 
    doc, 
    updateDoc,
    getDoc,
    setDoc 
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

let userId;

// Función para Inicializar Todas las Funcionalidades
const initializeAppFunctions = () => {
    loadAccounts();
    loadEntries();
    loadGoals();
    loadSharedSavings();
    setupEventListeners();
};

// Observa el estado de autenticación
onAuthStateChanged(auth, (user) => {
    if (user) {
        userId = user.uid;
        initializeAppFunctions();
    } else {
        window.location.href = 'login.html';
    }
});
// Configura los Event Listeners para los Formularios
const setupEventListeners = () => {
    // Manejo del Formulario de Agregar Movimiento
    const entryForm = document.getElementById('entry-form');
    if (entryForm) {
        entryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const description = document.getElementById('description').value.trim();
            const amount = parseFloat(document.getElementById('amount').value);
            const type = document.getElementById('type').value;
            const account = document.getElementById('account').value;

            if (!description || isNaN(amount) || !type || !account) {
                alert('Por favor, completa todos los campos correctamente.');
                return;
            }

            try {
                await addDoc(collection(db, 'entries'), {
                    userId,
                    description,
                    amount,
                    type,
                    account,
                    timestamp: new Date()
                });
                entryForm.reset();
                console.log('Movimiento agregado exitosamente');
            } catch (error) {
                console.error('Error al agregar movimiento:', error);
                alert('Error al agregar movimiento: ' + error.message);
            }
        });
    }

    // Manejo del Formulario de Agregar Cuenta
    const accountForm = document.getElementById('account-form');
    if (accountForm) {
        accountForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const accountName = document.getElementById('account-name').value.trim();
            const accountType = document.getElementById('account-type').value;

            if (!accountName || !accountType) {
                alert('Por favor, completa todos los campos correctamente.');
                return;
            }

            try {
                await addDoc(collection(db, 'accounts'), {
                    userId,
                    name: accountName,
                    type: accountType,
                    balance: 0,
                    timestamp: new Date()
                });
                accountForm.reset();
                console.log('Cuenta agregada exitosamente');
            } catch (error) {
                console.error('Error al agregar cuenta:', error);
                alert('Error al agregar cuenta: ' + error.message);
            }
        });
    }

    // Manejo del Formulario de Agregar Objetivo
    const goalForm = document.getElementById('goal-form');
    if (goalForm) {
        goalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const description = document.getElementById('goal-description').value.trim();
            const amount = parseFloat(document.getElementById('goal-amount').value);

            if (!description || isNaN(amount)) {
                alert('Por favor, completa todos los campos correctamente.');
                return;
            }

            try {
                await addDoc(collection(db, 'goals'), {
                    userId,
                    description,
                    amount,
                    achieved: false,
                    current: 0,
                    timestamp: new Date()
                });
                goalForm.reset();
                console.log('Objetivo agregado exitosamente');
            } catch (error) {
                console.error('Error al agregar objetivo:', error);
                alert('Error al agregar objetivo: ' + error.message);
            }
        });
    }

    // Manejo del Formulario de Ahorro Compartido
    const sharedSavingsForm = document.getElementById('shared-savings-form');
    if (sharedSavingsForm) {
        sharedSavingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const amount = parseFloat(document.getElementById('shared-amount').value);

            if (isNaN(amount) || amount <= 0) {
                alert('Por favor, ingresa una cantidad válida.');
                return;
            }

            try {
                const sharedDocRef = doc(db, 'sharedSavings', 'shared');
                const docSnap = await getDoc(sharedDocRef);

                if (docSnap.exists()) {
                    await updateDoc(sharedDocRef, {
                        total: (docSnap.data().total || 0) + amount
                    });
                    console.log('Ahorro compartido actualizado');
                } else {
                    await setDoc(sharedDocRef, { total: amount });
                    console.log('Ahorro compartido creado');
                }

                sharedSavingsForm.reset();
            } catch (error) {
                console.error('Error al agregar al ahorro compartido:', error);
                alert('Error al agregar al ahorro compartido: ' + error.message);
            }
        });
    }
};

// Función para Cargar Cuentas Bancarias
const loadAccounts = () => {
    const accountSelect = document.getElementById('account');
    const accountsList = document.getElementById('accounts-list');

    if (!accountSelect || !accountsList) {
        console.warn('Elementos de cuentas no encontrados');
        return;
    }

    const q = query(collection(db, 'accounts'), where('userId', '==', userId));
    onSnapshot(q, (snapshot) => {
        accountSelect.innerHTML = '<option value="">Selecciona una cuenta</option>';
        accountsList.innerHTML = '';

        snapshot.forEach((doc) => {
            const account = doc.data();
            const accountId = doc.id;

            // Agregar a la lista de cuentas
            const li = document.createElement('li');
            li.className = 'p-2 rounded bg-gray-100 flex justify-between items-center';
            li.textContent = `${account.name} (${account.type}) - Balance: $${account.balance.toFixed(2)}`;
            accountsList.appendChild(li);

            // Agregar al selector de cuentas
            const option = document.createElement('option');
            option.value = accountId;
            option.textContent = `${account.name} (${account.type})`;
            accountSelect.appendChild(option);
        });
    }, (error) => {
        console.error('Error al cargar cuentas:', error);
    });
};

// Función para Cargar Ingresos y Gastos
const loadEntries = () => {
    const entriesList = document.getElementById('entries-list');
    const totalIncomeEl = document.getElementById('total-income');
    const totalExpensesEl = document.getElementById('total-expenses');
    const totalSavingsEl = document.getElementById('total-savings');

    if (!entriesList || !totalIncomeEl || !totalExpensesEl || !totalSavingsEl) {
        console.warn('Elementos de balance o lista de entradas no encontrados');
        return;
    }

    const q = query(collection(db, 'entries'), where('userId', '==', userId));
    onSnapshot(q, (snapshot) => {
        let totalIncome = 0;
        let totalExpenses = 0;
        entriesList.innerHTML = '';

        snapshot.forEach((doc) => {
            const entry = doc.data();
            const li = document.createElement('li');
            li.className = `p-2 rounded ${entry.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`;
            li.textContent = `${entry.description}: $${entry.amount.toFixed(2)}  (${entry.type}) - Cuenta: ${entry.account}`;
            entriesList.appendChild(li);

            if (entry.type === 'income') {
                totalIncome += entry.amount;
            } else {
                totalExpenses += entry.amount;
            }
        });

        totalIncomeEl.textContent = totalIncome.toFixed(2);
        totalExpensesEl.textContent = totalExpenses.toFixed(2);
        totalSavingsEl.textContent = (totalIncome - totalExpenses).toFixed(2);
    }, (error) => {
        console.error('Error al cargar movimientos:', error);
    });
};

// Función para Cargar Objetivos Financieros
const loadGoals = () => {
    const goalsList = document.getElementById('goals-list');

    if (!goalsList) {
        console.warn('Elemento de lista de objetivos no encontrado');
        return;
    }

    const q = query(collection(db, 'goals'), where('userId', '==', userId));
    onSnapshot(q, (snapshot) => {
        goalsList.innerHTML = '';

        snapshot.forEach((doc) => {
            const goal = doc.data();
            const goalId = doc.id;
            const li = document.createElement('li');
            li.className = `p-2 rounded ${goal.achieved ? 'bg-blue-100' : 'bg-yellow-100'}  justify-between items-center`;
            li.innerHTML = `
                <span>${goal.description}: $${goal.amount.toFixed(2)} - ${goal.achieved ? 'Alcanzado' : 'En Progreso'}</span>
                ${!goal.achieved ? `<button data-id="${goalId}" class="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition duration-200">Añadir Ingreso</button>` : ''}
                <br>
                    <strong>Monto Actual: ${goal.current} <br>
                    Faltante: ${goal.amount-goal.current}<strong>
                `;
            goalsList.appendChild(li);
        });
    }, (error) => {
        console.error('Error al cargar objetivos:', error);
    });

    // Event Listener para Botones de Añadir Ingreso a Objetivos
    goalsList.addEventListener('click', async (e) => {
        if (e.target.tagName === 'BUTTON' && e.target.dataset.id) {
            const goalId = e.target.dataset.id;
            const amount = prompt('Ingresa la cantidad que deseas asignar a este objetivo:');

            const parsedAmount = parseFloat(amount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                alert('Por favor, ingresa una cantidad válida.');
                return;
            }

            try {
                const goalDocRef = doc(db, 'goals', goalId);
                const goalDoc = await getDoc(goalDocRef);
                if (goalDoc.exists()) {
                    const goalData = goalDoc.data();
                    const newCurrent = (goalData.current || 0) + parsedAmount;
                    let achieved = goalData.achieved;

                    if (newCurrent >= goalData.amount) {
                        achieved = true;
                    }

                    await updateDoc(goalDocRef, {
                        current: newCurrent,
                        achieved: achieved
                    });

                    alert(`Ingresos añadidos exitosamente. Nuevo progreso: $${newCurrent.toFixed(2)}`);
                }
            } catch (error) {
                console.error('Error al añadir ingreso al objetivo:', error);
                alert('Error al añadir ingreso al objetivo: ' + error.message);
            }
        }
    });
};

// Función para Cargar Ahorro Compartido
const loadSharedSavings = () => {
    const sharedTotalEl = document.getElementById('shared-total');

    if (!sharedTotalEl) {
        console.warn('Elemento de total de ahorro compartido no encontrado');
        return;
    }

    const sharedDocRef = doc(db, 'sharedSavings', 'shared');
    onSnapshot(sharedDocRef, (docSnap) => {
        if (docSnap.exists()) {
            sharedTotalEl.textContent = docSnap.data().total.toFixed(2);
        } else {
            sharedTotalEl.textContent = '0.00';
        }
    }, (error) => {
        console.error('Error al cargar ahorro compartido:', error);
    });
};
