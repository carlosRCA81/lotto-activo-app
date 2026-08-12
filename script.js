const SUPABASE_URL = 'https://cpyvyqgmzsywuktyghvt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNweXZ5cWdtenN5d3VrdHlnaHZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MzkzNjQsImV4cCI6MjEwMjExNTM2NH0.FIXiJzexrGLGrBPbWF-9NHtLkuRUeDowSckKIATJzyo';

const { createClient } = window.supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

// Lista Maestra de Animalitos Lotto Activo
const ANIMALITOS = [
    { num: "00", name: "Delfín" }, { num: "0", name: "Delfín" },
    { num: "01", name: "Carnero" }, { num: "02", name: "Toro" },
    { num: "03", name: "Ciempiés" }, { num: "04", name: "Alacrán" },
    { num: "05", name: "León" }, { num: "06", name: "Rana" },
    { num: "07", name: "Perico" }, { num: "08", name: "Ratón" },
    { num: "09", name: "Águila" }, { num: "10", name: "Tigre" },
    { num: "11", name: "Gato" }, { num: "12", name: "Caballo" },
    { num: "13", name: "Mono" }, { num: "14", name: "Paloma" },
    { num: "15", name: "Zorro" }, { num: "16", name: "Oso" },
    { num: "17", name: "Pavo" }, { num: "18", name: "Burro" },
    { num: "19", name: "Chivo" }, { num: "20", name: "Cochino" },
    { num: "21", name: "Gallo" }, { num: "22", name: "Camello" },
    { num: "23", name: "Cebra" }, { num: "24", name: "Iguana" },
    { num: "25", name: "Gallina" }, { num: "26", name: "Vaca" },
    { num: "27", name: "Perro" }, { num: "28", name: "Zamuro" },
    { num: "29", name: "Elefante" }, { num: "30", name: "Caimán" },
    { num: "31", name: "Lapa" }, { num: "32", name: "Ardilla" },
    { num: "33", name: "Pescado" }, { num: "34", name: "Venado" },
    { num: "35", name: "Jirafa" }, { num: "36", name: "Culebra" }
];

// Elementos DOM
const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app-screen');
const loginForm = document.getElementById('login-form');
const formResultado = document.getElementById('form-resultado');
const fechaInput = document.getElementById('fecha');
const numeroInput = document.getElementById('numero');
const nombreInput = document.getElementById('nombre');
const gridContainer = document.getElementById('animalitos-grid');
const listaResultados = document.getElementById('lista-resultados');
const badgeTotal = document.getElementById('badge-total');
const btnLogout = document.getElementById('btn-logout');
const selectPareja = document.getElementById('select-pareja-numero');
const resultadoPareja = document.getElementById('resultado-pareja');

// Paginación
let currentPage = 0;
const PAGE_SIZE = 15;
let todosLosDatosHistorial = [];

// Establecer fecha de hoy en el input
const hoy = new Date();
const year = hoy.getFullYear();
const month = String(hoy.getMonth() + 1).padStart(2, '0');
const day = String(hoy.getDate()).padStart(2, '0');
fechaInput.value = `${year}-${month}-${day}`;

// Renderizar la Grilla de Selección Táctil
function generarGrilla() {
    gridContainer.innerHTML = '';
    ANIMALITOS.forEach(item => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'animal-btn';
        btn.innerHTML = `<strong>${item.num}</strong><br><small>${item.name}</small>`;
        btn.addEventListener('click', () => {
            document.querySelectorAll('.animal-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            numeroInput.value = item.num;
            nombreInput.value = item.name;
        });
        gridContainer.appendChild(btn);
    });

    if (selectPareja) {
        selectPareja.innerHTML = '<option value="">Selecciona un Animalito...</option>';
        ANIMALITOS.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item.num;
            opt.textContent = `${item.num} - ${item.name}`;
            selectPareja.appendChild(opt);
        });
    }
}

// Navegación por Pestañas
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');

        if (btn.dataset.tab === 'tab-analisis') {
            ejecutarAlgoritmoAnalisis();
        }
    });
});

// Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();

    try {
        let { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
            const signupRes = await supabaseClient.auth.signUp({ email, password });
            if (signupRes.error) {
                alert("Error de acceso: " + signupRes.error.message);
                return;
            }
        }
        loginScreen.classList.add('hidden');
        appScreen.classList.remove('hidden');
        generarGrilla();
        cargarResultados();
    } catch (err) {
        alert("Error de conexión.");
    }
});

btnLogout.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    appScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
});

// Función para mostrar fecha amigable
function formatearFecha(fechaIso) {
    if (!fechaIso) return 'N/A';
    const d = new Date(fechaIso);
    if (isNaN(d.getTime())) return fechaIso;
    return d.toLocaleDateString('es-VE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Cargar Historial
async function cargarResultados() {
    listaResultados.innerHTML = '<li>Cargando...</li>';

    const from = currentPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error, count } = await supabaseClient
        .from('resultados')
        .select('*', { count: 'exact' })
        .order('id', { ascending: false })
        .range(from, to);

    if (error) {
        listaResultados.innerHTML = '<li>Error al conectar.</li>';
        return;
    }

    badgeTotal.textContent = `${count || 0} Total`;
    listaResultados.innerHTML = '';

    if (!data || data.length === 0) {
        listaResultados.innerHTML = '<li>Sin datos aún.</li>';
        return;
    }

    data.forEach(item => {
        const li = document.createElement('li');
        const fechaMostrar = formatearFecha(item.created_at);
        li.innerHTML = `
            <span><strong>${item.numero} - ${item.nombre}</strong></span>
            <span style="color: #a8b2d1; font-size: 0.75rem;">${fechaMostrar}</span>
        `;
        listaResultados.appendChild(li);
    });

    document.getElementById('page-info').textContent = `Pág. ${currentPage + 1}`;
    document.getElementById('btn-prev').disabled = currentPage === 0;
    document.getElementById('btn-next').disabled = (from + data.length) >= count;
}

document.getElementById('btn-prev').addEventListener('click', () => { if (currentPage > 0) { currentPage--; cargarResultados(); } });
document.getElementById('btn-next').addEventListener('click', () => { currentPage++; cargarResultados(); });

// ALGORITMO DE ANÁLISIS
async function ejecutarAlgoritmoAnalisis() {
    const { data } = await supabaseClient
        .from('resultados')
        .select('*')
        .order('id', { ascending: false });

    if (!data || data.length === 0) return;
    todosLosDatosHistorial = data;

    const conteo = {};
    ANIMALITOS.forEach(a => conteo[a.num] = 0);
    
    data.forEach(item => {
        if (conteo[item.numero] !== undefined) conteo[item.numero]++;
    });

    const ordenados = Object.entries(conteo).sort((a, b) => b[1] - a[1]);

    const topMas = ordenados.slice(0, 3).map(x => `${x[0]} (${x[1]} veces)`).join('<br>');
    const topMenos = ordenados.slice(-3).map(x => `${x[0]} (${x[1]} veces)`).join('<br>');

    if (document.getElementById('top-mas-salen')) {
        document.getElementById('top-mas-salen').innerHTML = topMas;
    }
    if (document.getElementById('top-menos-salen')) {
        document.getElementById('top-menos-salen').innerHTML = topMenos;
    }
}

// Guardar en Supabase sin errores de columna
formResultado.addEventListener('submit', async (e) => {
    e.preventDefault();
    const numero = numeroInput.value.trim();
    const nombre = nombreInput.value.trim();
    const fechaElegida = fechaInput.value; // ej: "2026-08-11"

    if (!numero || !nombre) {
        alert("Por favor selecciona un animalito de la grilla táctil.");
        return;
    }

    // Convertimos la fecha seleccionada en formato TIMESTAMP compatible con Supabase (created_at)
    const fechaObjeto = new Date(fechaElegida + 'T12:00:00');
    const timestampISO = fechaObjeto.toISOString();

    const { error } = await supabaseClient
        .from('resultados')
        .insert([{ 
            numero: numero, 
            nombre: nombre, 
            created_at: timestampISO 
        }]);

    if (error) {
        alert('Error: ' + error.message);
    } else {
        numeroInput.value = '';
        nombreInput.value = '';
        document.querySelectorAll('.animal-btn').forEach(b => b.classList.remove('selected'));
        currentPage = 0;
        await cargarResultados();
        alert('✅ ¡Resultado guardado con éxito!');
    }
});
