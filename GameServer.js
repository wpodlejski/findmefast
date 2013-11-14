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
	app.get('/styles.css',function(req,res){
	  res.sendfile(__dirname + '/public/styles.css');
	});

	app.get('/game.js',function(req,res){
	  res.sendfile(__dirname + '/public/game.js');
	});

	app.get('/',function(req,res){
	  res.sendfile(__dirname + '/public/game.html');
	});




	/********** GESTION DU JEU *************/

	var joueurs=[];
	var parties=[];



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

		var joueur, partie;
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

				joueur ={id:id,master:false,pseudo:'',ready:0,score:0};
				joueurs[id-1]=joueur;

				break;
			}
			i++;
		}
		
		console.log("Connexion d'un nouveau joueur id="+id);
		

		//accusé de reception de la connexion
		client.emit("accuse",{num:id,message:"ok game"});




		/************ partie asynchrone ****************/

		client.on('creerPartie', function(data) {
			//le joueur devient master de sa partie
			joueur.master=true;
			joueur.pseudo=data.nomJoueur;

			partie={
				"id":parties.length,
				"nom":data.nomPartie,
				"joueurs":[id]

			};

			console.log(partie);

			parties.push(partie);


			console.log(joueur.pseudo+" créé le nouveau jeu "+partie.nom);

			client.emit("jeu",{partie:partie,joueur:joueur});
			
		});


		client.on('listerParties', function(data) {
			console.log("listage des parties");
			client.emit("listeParties",{parties:parties});
		});






		client.on('rejoindrePartie', function(data) {

			partie=cherchePartie(data.id);
			if(partie==null){
				client.emit("jeu",{erreur:"Partie non trouvée"});
			}else{
				//TODO : tester les place restantes dans la partie
				//TODO : un joueur ne peut pas être 2 fois dans la partie
				//TODO : un oueur ne peux pas ouer 2 parties en me temps

				//ajout le joueur à la partie
				partie.joueurs.push(joueur.id);
				client.emit("jeu",{partie:partie,joueur:joueur});
				console.log("le joueur "+joueur.pseudo+" rejoint la partie n°"+data.id);

				//broadcast d'ajout de joueur
				//TODO IMPORTANT
				//créer des groupes de broadcast pour uniquement es joueurs de la partie 
				client.broadcast.emit("joueur",{joueur:joueur});


			}
		
		});


		client.on('disconnect', function() {
			console.log("deconnexion du joueur "+id);
			if(id==1){
				//si c'est le master on vire la partie sinon juste le joueur
				//TODO
				joueur={};
				partie={};
				

				client.broadcast.emit("fin",{});
				return;
				//que devient l'instance en cours????
				//comment la flusher???
			}

			client.broadcast.emit("joueur",{num:-id,message:""});
		});


		/***************** Fonctions *************************/

		cherchePartie = function(id){
			for (var i = 0; i < parties.length; i++) {

				var p = parties[i];
				console.log(p.id+"/"+id);

				if(p.id==id)return p;
			}
			return null;
		}


	});
})();