//# Node.js  multiplayer game pattern
//# 2013-10-11
//# Cedricici
(function(){
	//les dépendances

	var express = require('express');
	var app = express();
	var server = require('http').createServer(app);
	var io=require('socket.io').listen(server);

	//limite le debug verbeux de socket.io
	io.set('log level', 1);

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
		var partie={truc:999};// rustine de test
		

		//nombre de joueur maxi ou partie commencée
		/*
	    if(nbjoueurs>8 || partie){
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
			//TODO garder un historique des tours???
			// id = id de la partie
			// nom = nom de la partie
			// joueurs = liste des id des joueurs participants
			// tas = carte du tas
			// reponses = réponses éventuelles des joueurs du tas en cours
			//		razé à chaqe nouveau tas
			// attenteReponse : timeout d'attente de la réponse des autres joueurs
			//
			partie={
				id:parties.length,
				nom:data.nomPartie,
				joueurs:[id],
				tas:0,
				reponses:[],
				attenteReponse:0,
			};

			console.log("On créé la partie "+partie.nom+" pour le joueur "
				+joueur.pseudo+" dont l id est "+joueur.id);

			// creerDonne qui teste partie.tas ?????
			// TODO : le tas est créé a partir du jeu des jouaurs maintenenat
			//partie.tas=creerDonne(0);
			
			parties.push(partie);

			//on stocke l'ID de la partie créée
			//client.partieId=parties.indexOf(partie);
			client.partieId=partie.id;

			//on s'abonne au groupe correspondant à la partie
			client.join('partie'+client.partieId);


			console.log(joueur.pseudo+" créé le nouveau jeu "+partie.nom);
			//liste des joueurs pour cette partie ( forcément seul le joueur créateur !)
			client.emit("jeu",{partie:partie,joueurs:listeJoueurs()});

			
		});


		client.on('listerParties', function(data) {
			console.log("listage des parties "+parties.length);
			var p = [];
			for (var i = 0; i < parties.length; i++) {
				p.push({id:parties[i].id,nom:parties[i].nom,nbj:parties[i].joueurs.length});
			}
			console.log(p);

			client.emit("listeParties",{parties:p});
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

				//ajoute le joueur à la partie
				parties[data.idPartie].joueurs.push(joueur.id);
				//mise à jour de la copie locale????
				//!!!!!!!! TODO : vérifier l'effet réel
				partie=parties[data.idPartie];

				//on s'abonne au groupe correspondant à la partie
				client.join('partie'+partie.id);

				client.emit("jeu",{partie:partie,joueurs:listeJoueurs()});
				console.log("le joueur "+joueur.pseudo+" rejoint la partie n°"+data.idPartie);

				//broadcast d'ajout de joueur
				client.broadcast.to('partie'+partie.id).emit("joueur",{joueur:joueur});

			}
		
		});



		client.on('quitterPartie', function(data) {

			//retirer le joueur de la partie
			console.log("Liste des jouaurs de la partie que l'on veux quitter ("+id+")");
			console.log(partie.joueurs);

			for(var i=0;i<partie.joueurs.length;i++){

				// j est l'identifiant du joueur, i la position dans la partie
				var j = partie.joueurs[i]; 

				if(j==id){
					partie.joueurs.splice(i,1);
					//on retire le joueur du groupe de diffuion
					client.leave('partie'+partie.id);
				}
			}

			console.log("On a enlevé le joueur "+id+" de la partie :");
			console.log(partie.joueurs);
			

			if(partie.joueurs.length==0){
				//on enleve la partie de la liste des parties
				parties.splice(parties.indexOf(partie),1);
				partie={};
				console.log("Nombre de partie en mémoire :"+parties.length);

			}else{
				//on informe les joueurs que le jouer s'est barré de la partie
				client.broadcast.to('partie'+partie.id).emit("joueurQuitte",{joueur:joueur});
			}

			//on accuse comme pour une reconnexion
			client.emit("accuse",{message:"ok game",id:id});

		});



		
		client.on('pret', function(data) {
			joueur.ready=1;


			console.log("Partie vaut"+partie.id+" alors que client.partieId vaut "+client.partieId );

			//si tous les joueurs sont ready on démarre
			var ready=true;
			if(!partie){
				client.emit("erreur",{message:"Partie non trouvée"});
			}else{ 
				if(partie.joueurs.length==1){
					client.emit("erreur",{message:"Vous ne pouvez pas jouer tout seul !"});
					return;
				}

				for(var i=0;i<partie.joueurs.length;i++){
					var j = partie.joueurs[i];
					console.log("teste si le joueur "+j+" est ready :"+joueurs[j-1].ready);
					ready=ready&&joueurs[j-1].ready;
				}

				if(ready){
					//distribution initiale pour les joueurs

					for(var i=0;i<partie.joueurs.length;i++){
						var j=partie.joueurs[i];
						joueurs[j-1].donne=creerDonne();
					}
					//création du tas
					partie.tas=creerTas();
					//distribution des jeux
					for(var i=0;i<partie.joueurs.length;i++){
						var j=partie.joueurs[i];
						var donne=joueurs[j-1].donne;
						clients[j-1].emit("tour",{tas:partie.tas,cartes:donne,idVainqueur:0,joueurs:listeJoueurs()});
					}
					//C'est parti!!!!!!
				}else{
					//on anonce que le joueur est pret
					client.broadcast.to('partie'+partie.id).emit("pret",{joueur:joueur});
				}
			}

		});

		client.on('reponse', function(data) {

			console.log("le joueur "+joueur.pseudo+" trouve la carte "+joueur.donne[data.carte].img+" en "+data.rapid+"ms");
			console.log("Sa carte commune était "+joueur.carte);
			
			//traitement du jeu
			if(joueur.donne[data.carte].img==joueur.carte){
				//on ajoute sa réponse
				//TODO : bug en prévision si on ajoute sa réponse pendant
				//  l'execution du setTimeout attenteReponse!!!!!!
				partie.reponses.push({id:joueur.id,rapid:data.rapid});
				// si on est le premier à répondre OK
				// Attente de 1s pour les ex-aequo
				if(!partie.attenteReponse){
					partie.attenteReponse = setTimeout(function(){
						//teste le joueur le plus rapide

						var idRapido=0;
						var virRapido=999999999;

						for (var i = 0; i < partie.reponses.length; i++) {
							var v = partie.reponses[i].rapid;
							if(v<virRapido){
								virRapido=v;
								idRapido=partie.reponses[i].id;
							}
						};

						console.log("Le joueur le plus rapide est "+joueurs[idRapido-1].pseudo);

						//on augmente le score
						joueurs[idRapido-1].score++;
						//nouveau jeu pour le joueur
						//normalement il prends le tas comme nouveau jeu
						joueurs[idRapido-1].donne=partie.tas;

						//console.log("nouveau jeu du joueur avant le nouveau tas");
						//console.log(joueurs[idRapido-1].donne);

						//nouveau tas
						partie.tas=creerTas();
						
						//console.log("nouveau jeu du joueur APRES le nouveau tas");
						//console.log(joueurs[idRapido-1].donne);

						//RAZ des réponses
						partie.reponses=[];
						partie.attenteReponse=0;// TODO faut l un clearTimeout???

						for(var i=0;i<partie.joueurs.length;i++){
							var j=partie.joueurs[i];
							var donne=joueurs[j-1].donne;
							clients[j-1].emit("tour",{tas:partie.tas,cartes:donne,idVainqueur:idRapido,joueurs:listeJoueurs()});
						}

					},1000);
				}else{
					//on a trouvé la réponse mais on était pas le premier
					// on attends donc la 1s pour comparer
					//client.emit("reponse",{reponse:"attente"});
				}

			}else{
				//trompé
				client.emit("mauvaisereponse",{});
			}

		});


		client.on('debug', function() {
			client.emit("debug",{joueur:joueur,partie:partie,joueurs:joueurs,parties:parties});
		});


		client.on('reset', function() {

			console.log("*****************************************");
			console.log("            TOTAL RESET  ");
			console.log("*****************************************");


			var partieId=partie.id;

			//megamenage
			joueurs=[];
			clients=[];
			parties=[];

			joueur={};
			partie={truc:999};// rustine de test

			//il y a au moins le joueur ! !! pas cohérent avec le 'accuse'
			joueurs[id-1]=joueur;
			clients[id-1]=client;

			client.broadcast.to('partie'+partieId).emit("accuse",{message:"ok game",id:id});

		});


		client.on('disconnect', function() {
			console.log("deconnexion du joueur "+id);

			console.log(partie);

			try{

				//si c'est le master on vire la partie sinon juste le joueur
				if(partie && partie.joueurs && partie.joueurs.length>0 && partie.joueurs[0]==id){

					client.broadcast.to('partie'+partie.id).emit("fin",{partie:partie});
					
					//TODO //vider parties
					parties.splice(parties.indexOf(partie),1);
					partie={};

				}else{
					//Annonce la déconnexion du joueur
					client.broadcast.to('partie'+partie.id).emit("deconnexionJoueur",{joueur:joueur});
				}

				console.log("je vais essayer de virer le joueur : "+joueur.id);
				console.log(joueurs);

				joueurs.splice(joueurs.indexOf(joueur),1);
				joueur={};

				console.log(joueurs);
				console.log("Fin");

				clients.splice(clients.indexOf(client),1);
				client={};


			}catch(e){
				console.log("Interception d'exception dans la déconnexuion , Partie : ");
				console.log(partie);
				console.log(e);
				//destruction de l'objet
				for (prop in this){prop=null;}
			}


			//console.log(parties);
			//console.log(joueurs);
			//client.broadcast.emit("joueur",{num:-id,message:""});

		});


/***************** Fonctions *************************/
		
		// @return {id , pseudo , score}
		var listeJoueurs = function(){
		//créé la liste des joueurs et de leur pseudo
			var listeJoueurs=[];
			for (var i=0;i<partie.joueurs.length;i++) {
				var jid = partie.joueurs[i];
				//console.log("j'ajoute le joueur "+jid+" à la liste des joueurs");
				listeJoueurs.push({id:joueurs[jid-1].id,pseudo:joueurs[jid-1].pseudo,score:joueurs[jid-1].score});
			}

			return listeJoueurs;
		};


		//TODO : En fait c'est plus complexe que ca, car le nouveau tas doit tenir compte des jeux des
		//autres  joueurs, seul le vainqueur prend le nouveau tas !!! 
		//créé un jeu sans tenir compte du tas
		//il est plus simple de générere le tas en fonction du jeu des joueurs
		//retourne la donne
		var creerDonne = function(){

			var jeu=[];

			while(jeu.length<8){
				var n = (Math.random()*images.length) | 0;
				var img = images[n];
				var ok=true;
				//teste les carte précédentes
				for(var j=0;j<jeu.length;j++){
					if(jeu[j]==img){ok=false;break;}
				}
				if(ok){jeu.push(img);}
			}

			//melange des 8 valeurs
			//TODO trouver un algo certainement plus efficace
			//console.log(jeu);

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

			return donne;
		};

		//methode similaire à la précédente, 
		//génére le tas en fonction des cartes des joueurs
		// TODO a refactorer efficacement
		var creerTas = function(){

			//prends des cartes dans le jeu des joueurs

			//console.log("Dans creerTas, la partie vaut : ");
			//console.log(partie);

			var jeu=[];

			for (var i = 0; i < partie.joueurs.length; i++) {
				var jou = joueurs[partie.joueurs[i]-1];
				while(true){
					//une carte au hasard dans le jeu du joueur
					var n = (Math.random()*8) | 0;		
					var img = jou.donne[n].img;
					var ok=true;
					//on vérifie qu'elle n'est pas déjà dans le jeu
					for(var j=0;j<jeu.length;j++){
						if(jeu[j]==img){ok=false;break;}
					}
					if(ok){
						jeu.push(img);
						//mise à jour de la carte gagnante du joueur
						console.log("Carte commune du joueur "+jou.id+" : "+img);
						jou.carte=img;
						break;
					}
				}

			};

			//console.log("Avec les jeux des joueurs, la tas vaut pour l'instant :");
			//console.log(jeu);

			//on comble avec des cartes qui ne sont ni sur la carte, ni dans le jeu des joueurs

			while(jeu.length<8){
				var n = (Math.random()*images.length) | 0;
				var img = images[n];
				var ok=true;
				//teste les cartes précédentes
				for(var j=0;j<jeu.length;j++){
					//console.log("--- comparo jeu :"+jeu[j]+" avec "+img);
					if(jeu[j]==img){
						//console.log("Trouvée carte identique : "+img);
						ok=false;break;}
				}
				//puis les cartes des joueurs
				for (var i = 0; i < partie.joueurs.length; i++) {
					var k=partie.joueurs[i]-1;
					var jou = joueurs[k];
					for(var j=0;j<jou.donne.length;j++){
						//console.log("------- comparo joueur "+k+" :"+jou.donne[j].img+" avec "+img);
						if(jou.donne[j].img==img){
							//console.log("Trouvée carte identique : "+img);
							ok=false;break;}
					}
				}


				if(ok){
					//console.log("ajout d'une nouvelle carte : "+img);
					jeu.push(img);
				}
			}

			//melange des 8 valeurs
			//TODO trouver un algo certainement plus efficace
			//console.log("le jeu complet avant mélangeage pour le Tas :");
			//console.log(jeu);

			var tas=[];

			// j'enleve le mélange pour debugger
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
				tas.push(
					{img:jeu[i],
					 x:templates[0][i][0],
					 y:templates[0][i][1],
					 r:templates[0][i][2],
					 orientation:((Math.random()*360) | 0)}
				);
			}

			return tas;

		};


	});
})();