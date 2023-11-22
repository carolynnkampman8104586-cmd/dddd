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
  
    const uploadForm = document.getElementById('upload-form');
    const mediaInput = document.getElementById('media');
    const categorySelect = document.getElementById('category');
    const fileList = document.getElementById('fileList');
  
    // Configurar referências do Firebase
    const storage = firebase.storage();
    const firestore = firebase.firestore();
  
    // Função para recuperar e exibir mídias da categoria selecionada
    function showMedia(category) {
        fileList.innerHTML = '';
  
        // Recuperar mídias do Firestore com base na categoria
        firestore.collection('media').where('category', '==', category).get()
            .then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    const mediaData = doc.data();
                    const mediaElement = createMediaElement(mediaData.url);
  
                    fileList.appendChild(mediaElement);
                });
            })
            .catch((error) => {
                console.error('Erro ao recuperar mídias:', error);
            });
    }
  
    // Adicionar evento de alteração à categoria para exibir mídias correspondentes
    if (categorySelect) {
        categorySelect.addEventListener('change', function () {
          const selectedCategory = categorySelect.value;
          showMedia(selectedCategory);
        });
    }
  
    // Adicionar lógica específica para cada página
    const currentPage = window.location.pathname;
    if (currentPage.includes('games_index.html')) {
        showMedia('games');
    } else if (currentPage.includes('cinema_index.html')) {
        showMedia('cinema');
    } else if (currentPage.includes('musica_index.html')) {
        showMedia('musica');
    }
  
    // Restante do código para o formulário de upload
    if (uploadForm) {
        uploadForm.addEventListener('submit', function (e) {
            e.preventDefault();
  
            const mediaFile = mediaInput.files[0];
            const category = categorySelect.value;
  
            if (mediaFile && category) {
                // Criar uma referência única para a mídia no Storage
                const mediaRef = storage.ref(`${category}/${mediaFile.name}`);
  
                // Fazer upload da mídia para o Storage
                mediaRef.put(mediaFile)
                    .then((snapshot) => snapshot.ref.getDownloadURL())
                    .then((downloadURL) => firestore.collection('media').add({ category, url: downloadURL }))
                    .then(() => {
                        console.log('Mídia enviada com sucesso!');
                        // Limpar formulário após o envio
                        uploadForm.reset();
                        // Atualizar a exibição de mídia
                        showMedia(category);
                    })
                    .catch((error) => console.error('Erro no envio da mídia:', error));
            } else {
                console.error('Por favor, escolha uma mídia e uma categoria.');
            }
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
  
      firebase.auth().onAuthStateChanged(user => {
        if (user) {
          var storageRef = storage.ref('users/' + user.uid + '/files/' + file.name);
          var metadata = {
            customMetadata: {
              'title': imageTitle,
              'description': imageDescription
            }
          };
  
          var task = storageRef.put(file, metadata);
  
          task.then(snapshot => {
            console.log('Arquivo enviado com sucesso!');
            fileInput.value = '';
            displayFiles();
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
  
  function displayFiles() {
    var cardContainer = document.getElementById('cardContainer');
    cardContainer.innerHTML = '';
  
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        var filesRef = storage.ref('users/' + user.uid + '/files');
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
  document.addEventListener('DOMContentLoaded', displayFiles);
  
  
  function removeFile(userId, fileName) {
    var fileRef = storage.ref('users/' + userId + '/files/' + fileName);
  
    fileRef.delete().then(() => {
      console.log('Arquivo removido com sucesso.');
      displayFiles();
    }).catch(error => {
      console.error('Erro ao remover arquivo:', error);
    });
  }
  
  document.addEventListener('DOMContentLoaded', displayFiles);
  /*
  function displayImages() {
    var imageContainer = document.getElementById('cardContainer');
  
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        var filesRef = storage.ref('users/' + user.uid + '/files');
        filesRef.listAll().then(result => {
          result.items.forEach(item => {
            item.getDownloadURL().then(url => {
              item.getMetadata().then(metadata => {
  
                let arquivoconfig = user.uid + ".txt"
                if (metadata.name != arquivoconfig && metadata.contentType.startsWith('image')) {
  
                  var cardAndButtonContainer = document.createElement('div');
                  cardAndButtonContainer.classList.add('card-and-button-container');
  
                  var card = document.createElement('div');
                  card.classList.add('card');
                  card.onclick = function () {
                    window.location.href = 'produto.html';
                  };
  
                  var cardImage = document.createElement('img');
                  cardImage.src = url;
                  cardImage.alt = 'Imagem do produto';
  
                  var cardContent = document.createElement('div');
                  cardContent.classList.add('card-content');
  
                  var title = document.createElement('h2');
                  var description = document.createElement('p');
  
                  if (metadata.customMetadata && metadata.customMetadata.title) {
                    title.textContent = metadata.customMetadata.title;
                  } else {
                    title.textContent = 'Título padrão';
                  }
  
                  if (metadata.customMetadata && metadata.customMetadata.description) {
                    description.textContent = metadata.customMetadata.description;
                  } else {
                    description.textContent = 'Sem descrição';
                  }
  
                  cardContent.appendChild(title);
                  cardContent.appendChild(description);
                  cardContent.appendChild(cardImage);
                  card.appendChild(cardContent);
  
                  cardAndButtonContainer.appendChild(card);
  
                  var removeButton = document.createElement('button');
                  removeButton.textContent = 'Remover';
                  removeButton.addEventListener('click', function () {
                    removeFile(user.uid, item.name);
                  });
                  cardAndButtonContainer.appendChild(removeButton);
  
                  imageContainer.appendChild(cardAndButtonContainer);
                }
              });
            });
          });
        }).catch(error => {
          console.error('Erro ao recuperar imagens:', error);
        });
      } else {
        console.error('Usuário não autenticado.');
      }
    });
  }
  
  document.addEventListener('DOMContentLoaded', displayImages);
  */
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