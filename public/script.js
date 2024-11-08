const element = document.getElementById('loginForm');
    if (element) {
        element.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        
        console.log (username, 'вошел в систему');
        
        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.token) {
                localStorage.setItem('token', data.token);
                updateUserData();
            } else {
                alert(data.error);
            }
        })
        .catch(error => console.error('Ошибка:', error));

    });
}


function updateUserData() {
    const token = localStorage.getItem('token');
    const authHeader = token ? `Bearer ${token}` : '';
    fetch('/api/user', {
        headers: {
          'Authorization': authHeader
        }
      })           
    .then(response => response.json())
    .then(data => {
        localStorage.setItem('username', data.username);
        localStorage.setItem('role', data.role);
        const userDataDiv = document.getElementById('userData');
        userDataDiv.innerHTML = `
            <p>Привет, ${localStorage.getItem('username')}!</p>
            <p>Роль: ${localStorage.getItem('role')}</p>
        `;
        window.location.href = 'http://localhost:3000/api/admin';
    })
    .catch(error => console.error('Ошибка:', error));

    // fetch('/api/admin', {
    //     method: 'GET',
    //     headers: {
    //         'Role': localStorage.getItem('role')
    //     }
    // })
    // .then(response => {
    //   if (!response.ok) {
    //     throw new Error(`HTTP error! status: ${response.status}`);
    //   }
    //   return response.text();
    // })
    // .then(data => {
    //     // console.log(data);
    //     //window.location.href = 'http://localhost:3000/api/admin';
    //     window.location.href = data;
    // })
    // .catch(error => console.error('Error:', error));
}

function inIterface() {
    window.location.href = 'http://localhost:3000/api/admin';
}
