const mediaInput = document.getElementById('media');
const categorySelect = document.getElementById('categorySelect');

function toggleMenu() {
  var menuDropdown = document.getElementById("menuDropdown");
  menuDropdown.classList.toggle("show-menu");
}

document.addEventListener('DOMContentLoaded', function () {
  const logoutButton = document.getElementById('Sair');

  logoutButton.addEventListener('click', () => {
    firebase.auth().signOut().then(() => {
      window.location.href = '../Login/login.html';
    }).catch((error) => {
      console.error('Erro ao encerrar a sessão: ', error);
    });
  });

  const userPhoto = document.getElementById('userPhoto');
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      var userPhotoUrl = user.photoURL;
      userPhoto.style.backgroundImage = "url('" + (userPhotoUrl || '../IMG/UsuarioFoto.png') + "')";
    } else {
      console.error('Usuário não autenticado.');
    }
  });

  const categories = ['games', 'cinema', 'musica']; // Adicione todas as categorias que você tem

  const fileList = document.getElementById('fileList');
  const currentPage = window.location.pathname;

  if (currentPage.includes('home_index.html')) {
    for (const category of categories) {
      showMedia(category, fileList);
    }
  } else if (currentPage.includes('games_index.html')) {
    showMedia('games', fileList);
  } else if (currentPage.includes('cinema_index.html')) {
    showMedia('cinema', fileList);
  } else if (currentPage.includes('musica_index.html')) {
    showMedia('musica', fileList);
  }
  function showMedia(category, targetElement) {
    targetElement.innerHTML = '';
  
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        const baseRef = storage.ref(`users/${user.uid}/files/`);
        const categoriesRef = category ? baseRef.child(`${category}/`) : baseRef;
  
        categoriesRef.listAll().then(result => {
          console.log('Número de itens no resultado:', result.items.length);
  
          result.items.forEach(item => {
            item.getDownloadURL().then(url => {
              item.getMetadata().then(metadata => {
                let arquivoconfig = user.uid + ".txt";
                if (metadata.name != arquivoconfig && (metadata.contentType.startsWith('image') || metadata.contentType.startsWith('video'))) {
                  console.log('Criando card para:', metadata.customMetadata.title);
                  criarCardComDescricaoETitulo(metadata.customMetadata.title, metadata.customMetadata.description, url, metadata, user, item.name);
                }
              });
            }).catch(error => {
              console.error('Erro ao recuperar metadados:', error);
            });
          });
        }).catch(error => {
          console.error('Erro ao recuperar arquivos:', error);
        });
      } else {
        console.error('Usuário não autenticado.');
      }
    });
  }
  if (categorySelect) {
    categorySelect.addEventListener('change', function () {
      const selectedCategory = categorySelect.value;
      showMedia(selectedCategory);
    });
  }
});


function uploadFile() {
  console.log('Função uploadFile() chamada');
  var fileInput = document.getElementById('fileInput');
  var file = fileInput.files[0];

  if (file) {
    var imageTitle = document.getElementById('imageTitle').value;
    var imageDescription = document.getElementById('imageDescription').value;
    var category = document.getElementById('categorySelect').value; // Obter a categoria selecionada

    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        var storageRef = storage.ref(`users/${user.uid}/files/${category}/${file.name}`); // Incluir a categoria na referência do Storage
        var metadata = {
          customMetadata: {
            'title': imageTitle,
            'description': imageDescription,
            'category': category // Incluir a categoria nos metadados
          }
        };

        var task = storageRef.put(file, metadata);

        task.then(snapshot => {
          console.log('Arquivo enviado com sucesso!');
          fileInput.value = '';
          displayFiles(category);

          // Fechar o modal
          var fileModal = new bootstrap.Modal(document.getElementById('fileModal'));
          fileModal.hide();
        }).catch(error => {
          console.error('Erro no envio do arquivo:', error);
        });
      } else {
        console.error('Usuário não autenticado.');
      }
    });
  } else {
    console.error('Nenhum arquivo selecionado.');
  }
}
function displayFiles(category) {
  var cardContainer = document.getElementById('cardContainer');
  cardContainer.innerHTML = '';

  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      var filesRef = storage.ref(`users/${user.uid}/files/${category}/`);
      filesRef.listAll().then(result => {
        result.items.forEach(item => {
          item.getDownloadURL().then(url => {
            item.getMetadata().then(metadata => {
              let arquivoconfig = user.uid + ".txt";
              if (metadata.name != arquivoconfig && (metadata.contentType.startsWith('image') || metadata.contentType.startsWith('video'))) {
                criarCardComDescricaoETitulo(metadata.customMetadata.title, metadata.customMetadata.description, url, metadata, user, item.name);
              }
            });
          }).catch(error => {
            console.error('Erro ao recuperar metadados:', error);
          });
        });
      }).catch(error => {
        console.error('Erro ao recuperar arquivos:', error);
      });
    } else {
      console.error('Usuário não autenticado.');
    }
  });
}


function criarCardComDescricaoETitulo(titulo, descricao, url, metadata, user, fileName) {
  // Crie um novo elemento div para o contêiner do card e botão
  var cardAndButtonContainer = document.createElement('div');
  cardAndButtonContainer.classList.add('card-and-button-container');

  // Crie um novo elemento div para o card
  var card = document.createElement('div');
  card.classList.add('card');
  card.onclick = function () {
    window.location.href = 'produto.html';
  };

  if (metadata.contentType.startsWith('image')) {
    var cardImage = document.createElement('img');
    cardImage.src = url;
    cardImage.alt = 'Imagem do produto';
    cardImage.classList.add('card-image'); // Adiciona uma classe à imagem
    card.appendChild(cardImage);
  } else if (metadata.contentType.startsWith('video')) {
    var cardVideo = document.createElement('video');
    cardVideo.src = url;
    cardVideo.controls = true;
    card.appendChild(cardVideo);
  }

  var cardContent = document.createElement('div');
  cardContent.classList.add('card-content');

  var title = document.createElement('h2');
  title.textContent = titulo || 'Título padrão';

  var description = document.createElement('p');
  description.textContent = descricao || 'Sem descrição';

  cardContent.appendChild(title);
  cardContent.appendChild(description);
  card.appendChild(cardContent);

  cardAndButtonContainer.appendChild(card);

  var removeButton = document.createElement('button');
  removeButton.textContent = 'Remover';
  removeButton.addEventListener('click', function () {
    removeFile(user.uid, fileName);
  });

  cardAndButtonContainer.appendChild(removeButton);

  document.getElementById('cardContainer').appendChild(cardAndButtonContainer);
}

// Chame a função displayFiles no carregamento da página
document.addEventListener('DOMContentLoaded', displayFiles());


function getCurrentCategory() {
  var currentPage = window.location.pathname;

  if (currentPage.includes('games_index.html')) {
    return 'games';
  } else if (currentPage.includes('cinema_index.html')) {
    return 'cinema';
  } else if (currentPage.includes('musica_index.html')) {
    return 'musica';
  } else {
    return 'home';
  }
}

function removeFile(userId, fileName) {
  var category = getCurrentCategory();

  if (category !== 'home') {
    var fileRef = storage.ref(`users/${userId}/files/${category}/${fileName}`);

    fileRef.delete().then(() => {
      console.log('Arquivo removido com sucesso.');
      displayFiles(); // Chama a função para atualizar a exibição dos arquivos após a remoção
    }).catch(error => {
      console.error('Erro ao remover arquivo:', error);
    });
  } else {
    // Se estiver na página principal, exclua o arquivo de todas as categorias
    for (const cat of ['games', 'cinema', 'musica']) {
      var fileRef = storage.ref(`users/${userId}/files/${cat}/${fileName}`);
      fileRef.delete().catch(error => {
        console.error(`Erro ao remover arquivo da categoria ${cat}:`, error);
      });
    }

    console.log('Arquivo removido com sucesso de todas as categorias.');
    displayFiles(); // Chama a função para atualizar a exibição dos arquivos após a remoção
  }
}
document.addEventListener('DOMContentLoaded', displayFiles(category));
function toggleFormVisibility() {
  var fileForm = document.getElementById("fileForm");
  fileForm.style.display = (fileForm.style.display === 'none' || fileForm.style.display === '') ? 'block' : 'none';
}

function createMediaElement(url) {
  const mediaElement = document.createElement('div');

  if (url.endsWith('.mp3') || url.endsWith('.wav') || url.endsWith('.ogg')) {
    const audio = document.createElement('audio');
    audio.controls = true;
    audio.src = url;
    mediaElement.appendChild(audio);
  } else if (url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg')) {
    const video = document.createElement('video');
    video.controls = true;
    video.src = url;
    mediaElement.appendChild(video);
  } else {
    const image = document.createElement('img');
    image.src = url;
    mediaElement.appendChild(image);
  }

  return mediaElement;
}
