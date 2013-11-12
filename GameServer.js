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




	/* constantes */
	var nbjoueurs=0;
	var joueurs=[];

	//on ne gere qu'une partie pour l'instant
	//'partie' indique si la partie en débutée
	var partie=false;

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



	//gestion du serveur de socket
	//lors de la connexion d'un client
	io.sockets.on('connection', function (client) {


		//nombre de joueur maxi ou partie commencée
	    if(nbjoueurs>6 || partie){
			client.emit("accuse",{num:0,run:run,message:"jeux plein : mode spectateur"});
			return;
	    }

		nbjoueurs+=1;
		//recherche de l'id le plus petit disponible hormis 1
		//qui ne peux se deconnecter sans tuer la partie
		var id=1;
		var i=0;
		while(i<=joueurs.length){
			if(!joueurs[i]){
				id=i+1;
				joueurs[id-1]={num:id,client:client,pseudo:'',ready:0,score:0};
				//master=n;
				break;
			}
			i++;
		}

		console.log(nbjoueurs+" joueurs");


		//accusé de reception de la connexion
		client.emit("accuse",{num:id,message:"ok game"});



		/************ partie asynchrone ****************/

		client.on('pseudo', function(data) {

			console.log(data.pseudo+" s'est inseré dans le jeu");
			joueurs[id-1].pseudo=data.pseudo;

			client.broadcast.emit("joueur",{num:id,pseudo:data.pseudo,message:""});

		});

		client.on('ready', function(data) {
			joueurs[id-1].ready=1;

			client.broadcast.emit("ready",{num:id});

			//on vérifie que tous les joueurs sont prêt
			/*
			var okstart=true;
			for(var i=1;i<5;i++){
				console.log(joueurs[i]+" "+ready[i]);
				if(joueurs[i] && !ready[i]){
					okstart=false;
				}
			}
			if(okstart){
				//le master peut lancer le jeu
				console.log("envois du message au master");
				joueurs[master].emit("startable");

			}
			*/
		});


		client.on('start', function(data) {
			//normalement, seul le master peut envoyer ce message
			//les autres joueurs sont cencés être ready
			client.emit("start",coords);
			client.broadcast.emit("start",coords);
			partie=true;

		});


		client.on('disconnect', function() {
			console.log("deconnexion du joueur "+id);
			if(id==1){
				//fin de partie
				client.broadcast.emit("fin",{num:0,message:""});
				//on vide la partie
				joueurs=[];
				nbjoueurs=0;
				partie=false;
				
				return;
				//que devient l'instance en cours????
				//comment la flusher???
			}

			nbjoueurs-=1;
			joueurs[id-1]=false;

			console.log(nbjoueurs+" joueurs maintenant:");
			//annonce a tous le monde d'un joueur en moins
			client.broadcast.emit("joueur",{num:-id,message:""});
		});

	});
})();