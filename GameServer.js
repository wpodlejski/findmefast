//# Node.js  multiplayer game pattern
//# 2013-10-11
//# Cedricici
(function(){
	//les dépendances

	var express = require('express');
	var app = express();
	var server = require('http').createServer(app);
	var io=require('socket.io').listen(server);
	//var width=800;
	//var height=800;

	//lancement du serveur HTTP
	server.listen(1111);

	//Renvoi les fichiers statiques
	//la racine puis le reste
	app.get('/',function(req,res){
	  res.sendfile(__dirname + '/public/game.html');
	});
	app.use(express.static(__dirname + '/public'));



	/********** GESTION DU JEU *************/

	var joueurs=[];
	var clients=[];
	var parties=[];
	
	//les images
	var cheminImage='/images/';
	var images=['penguin.svg','ninja.svg','boar.svg','extraterrestrial_alien.svg','elephant.svg','horse.svg','pill.svg','princess.svg','mens_symbol.svg','high_voltage_sign.svg','chicken.svg','poop.svg','rainbow_solid.svg','frog_face.svg','koala.svg','anchor.svg','wink.svg','dog_face.svg','bactrian_camel.svg','crescent_moon.svg','hot_beverage.svg','cyclone.svg','satisfied.svg','sun.svg','cactus.svg','spouting_whale.svg','snake_alt.svg','snail.svg','heart.svg'];
	
	//premier template
	var templates=[]
	templates.push([[23,76,23],[55,89,11],[88,88,12],[70,51,29],[17,36,17],[10,10,9],[43,15,15],[87,12,12]]);



	//console.log(images);

	//pas très modulable tout ca... a refaire...
	// prototyper l'objet client?
	//réécriture à partir de 1 et non 0 , le 0 ne sert à rien donc
	/*
	var joueurs=[0,0,0,0,0];// TODO stocker les spectateurs
	var ready=[0,0,0,0,0];
	var pseudos=[0,0,0,0,0];
	var scores=[0,0,0,0,0];



	var master=0; // seul le master peut démmarer le jeu
	var run=false;
	*/


	//le socket
	//format des message json:
	//acceptation on non du joueur
	//  accuse {num,run,message}
	//annonce d'un nouveau joueur ou d'un joueur en moins (num<0)
	//  joueur {num,message}
	//début du jeu
	//	start {x,y,a,b}
	//position de la raquette
	//	raqpos {}
	//position de la balle
	//	balpos {}
	//

	//TODO nettoyer régulièrement joueurs et parties


	//gestion du serveur de socket
	//lors de la connexion d'un client
	io.sockets.on('connection', function (client) {

		
		var joueur={};
		var partie={};
		
		//client.joueur=joueur;


		//nombre de joueur maxi ou partie commencée
		/*
	    if(nbjoueurs>6 || partie){
			client.emit("accuse",{id:0,message:"jeux plein : mode spectateur"});
			return;
	    }

		nbjoueurs+=1;
		*/
		//recherche de l'id le plus petit disponible 
		/*
		* TODO : Regarder les limites de cette fonction a +++ joueurs
		*/
		var id=1;
		var i=0;

		while(i<=joueurs.length){
			if(!joueurs[i]){
				id=i+1;

				joueur ={id:id,
					master:0,
					pseudo:'',
					ready:0,
					donne:0,
					carte:0,
					score:0};

				joueurs[id-1]=joueur;
				clients[id-1]=client;
				break;
			}
			i++;
		}
		
		console.log("Connexion d'un nouveau joueur id="+id);
		

		//accusé de reception de la connexion
		//globalement on pourrait avantageusement utiliser 
		// les callback de emit sur le client mais ca compliquerais la compréhension
		// p-ê  apres le POC ?

		client.emit("accuse",{message:"ok game",id:id});




		/************ partie asynchrone ****************/

		client.on('creerPartie', function(data) {
			//le joueur devient master de sa partie
			joueur.master=1;
			joueur.pseudo=data.nomJoueur;

			//ATTENTION la partie contient les id des joueurs!
			partie={
				id:parties.length,
				nom:data.nomPartie,
				joueurs:[id],
				tas:0
			};

			console.log("On créé la partie "+partie.nom+" pour le joueur "
				+joueurs[partie.joueurs[0]-1].pseudo+" dont l id est "+joueur.id);

			// creerDonne qui teste partie.tas ?????
			partie.tas=creerDonne(0);

			parties.push(partie);

			//on stocke l'ID de la partie créée
			//client.partieId=parties.indexOf(partie);
			client.partieId=partie.id;

			//on s'abonne au groupe correspondant à la partie
			client.join('partie'+client.partieId);


			console.log(joueur.pseudo+" créé le nouveau jeu "+partie.nom);
			var listeJoueurs=[{id:joueur.id,pseudo:joueur.pseudo}];
			client.emit("jeu",{partie:partie,joueurs:listeJoueurs});

			
		});


		client.on('listerParties', function(data) {
			console.log("listage des parties");
			client.emit("listeParties",{parties:parties});
		});

		client.on('rejoindrePartie', function(data) {

			partie=parties[data.idPartie];
			joueur.pseudo=data.nomJoueur;
			
			if(!partie){
				client.emit("jeu",{erreur:"Partie non trouvée"});
			}else{
				//TODO : tester les place restantes dans la partie
				//TODO : tester si le master est ready
				//TODO : un joueur ne peut pas être 2 fois dans la partie
				//TODO : un joueur ne peux pas jouer 2 parties en me temps


				//on ne stocke que l'id de la partie, pas l'objet
				client.partieId=data.idPartie;

				//ajout le joueur à la partie
				parties[data.idPartie].joueurs.push(joueur.id);
				//mise à jour de la copie locale????
				//TODO : vérifier l'effet réel
				partie=parties[data.idPartie];

				//on s'abonne au groupe correspondant à la partie
				client.join('partie'+partie.id);

				//créé la liste des joueurs et de leur pseudo
								//créé la liste des joueurs et de leur pseudo
				var listeJoueurs=[];
				for (var i=0;i<partie.joueurs.length;i++) {
					var jid = partie.joueurs[i];
					console.log("j'ajoute le joueur "+jid+" à la liste des joueurs");
					listeJoueurs.push({id:joueurs[jid-1].id,pseudo:joueurs[jid-1].pseudo});
				}

				client.emit("jeu",{partie:partie,joueurs:listeJoueurs});
				console.log("le joueur "+joueur.pseudo+" rejoint la partie n°"+data.idPartie);

				//broadcast d'ajout de joueur
				client.broadcast.to('partie'+partie.id).emit("joueur",{joueur:joueur});

			}
		
		});
		
		client.on('pret', function(data) {
			joueur.ready=1;


			console.log("Partie vaut"+partie.id+" alors que client.partieId vaut "+client.partieId );

			//si tous les joueurs sont ready on démarre
			var ready=true;
			if(!partie){
				client.emit("erreur",{message:"Partie non trouvée"});
			}else{ 
				for(var i=0;i<partie.joueurs.length;i++){
					var j = partie.joueurs[i];
					console.log("teste si le joueur "+j+" est ready :"+joueurs[j-1].ready);
					ready=ready&&joueurs[j-1].ready;
				}
				if(ready){
					//distribuer les tours
					donne_tour();
					//puis lancer le jeu
				}else{
					//on anonce que le joueur est pret
					client.broadcast.to('partie'+partie.id).emit("pret",{joueur:joueur});
				}
			}

		});

		client.on('reponse', function(data) {

			console.log("le joueur "+joueur.pseudo+" trouve la carte "+joueur.donne[data.carte].img+" en "+data.rapid+"ms");
			console.log("Sa carte commune était "+joueur.carte);

		});



		client.on('debug', function() {
			client.emit("debug",{joueur:joueur,partie:partie,joueurs:joueurs,parties:parties});
		});


		client.on('disconnect', function() {
			console.log("deconnexion du joueur "+id);

			console.log(partie);

			try{

				//si c'est le master on vire la partie sinon juste le joueur
				if(partie && partie.joueurs && partie.joueurs.length>0 && partie.joueurs[0]==id){

					client.broadcast.to('partie'+partie.id).emit("fin",{partie:partie});
					
					//TODO //vider parties
					parties.splice(array.indexOf(partie),1);
					partie={};

				}else{
					//Annonce la déconexion du joueur
					client.broadcast.to('partie'+partie.id).emit("deconnexionJoueur",{joueur:joueur});
				}

				joueurs.splice(array.indexOf(joueur),1);
				joueur={};

				clients.splice(array.indexOf(client),1);
				client={};


			}catch(e){
				console.log(e);
				for (prop in e){console.log(e);}

				//destruction de l'objet
				for (prop in this){prop=null;}
			}

			//TODO vider joueur
			//client.broadcast.emit("joueur",{num:-id,message:""});

		});


		/***************** Fonctions *************************/
		
		var donne_tour = function(){
			//envoi un jeu à chaque participant du groupe
			for(var i=0;i<partie.joueurs.length;i++){
				
				var j = partie.joueurs[i];

				var donne=creerDonne(partie.tas);
				joueurs[j-1].donne=donne;

				clients[j-1].emit("tour",{tas:partie.tas,cartes:donne});


			}

		}



		//créé un jeu en fonction du 'tas actuel' (cartes)
		var creerDonne = function(tas){

			console.log("maintenant, la partie vaut :"+partie);

			//créé un jeu de 8 cartes
			var jeu=[];
			//si le tas existe récupère une carte dans le tas
			if(tas){
				var carte = tas[(Math.random()*8) | 0].img;
				jeu.push(carte);
				joueur.carte=carte;
			}

			//la carte commune de ce tirage est 

			while(jeu.length<8){
				var n = (Math.random()*images.length) | 0;
				var img = images[n];
				var ok=true;
				//teste les carte précédentes
				for(var j=0;j<jeu.length;j++){
					if(jeu[j]==img){ok=false;break;}
				}
				//et éventuellement le tas
				if(tas){
					for(var j=0;j<8;j++){
						if(tas[j].img==img){ok=false;break;}
					}
				}
				if(ok){jeu.push(img);}
			}

			//melange des 8 valeurs
			//TODO trouver un algo certainement plus efficace

			console.log(jeu);

			var donne=[];
			for (var i=0;i<8;i++){
				var j=(Math.random()*8-i) | 0;
           		//on swap
            	var tmp = jeu[i];
            	jeu[i]=jeu[i+j];
            	jeu[i+j]=tmp;
            	//on rempli la donne
				//TODO si on le fait ici on a de nombreux doublon???
				// comprend pas p?
        	}	
        	// du coup re-boucle
        	for (var i=0;i<8;i++){
				donne.push(
					{img:jeu[i],
					 x:templates[0][i][0],
					 y:templates[0][i][1],
					 r:templates[0][i][2],
					 orientation:((Math.random()*360) | 0)}
				);
        	}


        	console.log(jeu);

			return donne;
		}

		/*
		var cherchePartie = function(id){
			for (var i = 0; i < parties.length; i++) {

				var p = parties[i];
				console.log("Recherche de la parte "+p.id+"/"+id);

				if(p.id==id)return p;
			}
			return null;
		}
		*/

	});
})();