/*$(function(){*/ // on zappe jquery

var GAME=GAME||{};



GAME.gameStart = (function(){


	var pageCourante="#jeu";
	var id=0;

	/*
	var pong; //le thread
	var width=800;
	var height=800;
	var but=100; // dimension d'un 1/2 but
	var speed=10;
	var ptmur=1;
	var ptbut=10;
	var drag=false;
	var joueur=0;

	var master=false;
	var raq=[];// les joueurs (le raq[0] n'existe pas)
	var ball={x:width/2,y:height/2,a:0,b:0,color:"rgb(255,0,0)"}

	var elapsedtime=0;

	$("#ready").attr('disabled', false);
	$("#go").attr('disabled', true);
	*/


	// ETAPE 1 : la connexion
	var sock= io.connect();

	//affiche l'ecran d'accueil



	//le reste est asynchrone
	/*******************************************************/

	// sock.emit("ballpos",{x:,y:,score:});
	// sock.emit("pseudo",{pseudo:monpseudo});

	/*
	function majscore(){
		//les scores
		//TODO faire la mise a jour uniquement en cas de changement de score...
		for(var i=1;i<=4;i++){
			if(raq[i]){
				$("#joueur"+i+" input").val(raq[i].score);
			}
		}
	}
	*/


	/****************** Partie socket **************************/

	//accusé de reception de la connexion au serveur
	//TODO : surtout utile en cas de  reconnexion !!! 
	sock.on("accuse",function(data){
		//console.log(data);
		id=data.id;
		//on ramene à l'accueil
		switchPage("#accueil");

	});


	sock.on("jeu",function(data){
		if(data.erreur){
			alert("Erreur :"+data.erreur);
			return;
		}
		console.log(data.partie);

		document.getElementById("pseudo").innerHTML=data.joueur.pseudo;
		switchPage("#jeu");

		//passage en mode attente
		var e = document.querySelector("#jeu nav .ready .icon");
		removeClass(e,'pret');
		addClass(e,'attente');	//passage en mode attente

	});

	// un nouveau joueur se connecte
	sock.on("joueur",function(data){
		console.log(data.joueur);

  		var element=document.createElement("li");
  		element.innerHTML='<a class="joueur'+data.joueur.id+' attente" href="rien" ><span class="icon" ></span>'+data.joueur.pseudo+'</a>';
		
		document.getElementById("listeJoueurs").appendChild(element);

	});

	// message reçu lorsqu'un joueur est prêt.
	sock.on("listeParties",function(data){
		console.log(data);

		var options='';
		for(var i=0;i<data.parties.length;i++){
			options+='<option value="'+data.parties[i].id+'" >'+data.parties[i].nom+
			'('+data.parties[i].joueurs.length+')</option>';
		}
		document.getElementById("liste_parties").innerHTML=options;

		switchPage("#lister_parties");
	});


	// message reçu lorsqu'un jeour est prêt
	sock.on("pret",function(data){
		console.log("Le joueur "+data.joueur.pseudo+" est prêt!");
		
		if(data.joueur.id==id){
			var e=document.querySelector("#jeu nav .ready .icon");
			removeClass(e,'attente');
			addClass(e,'pret');	//passage en mode pret
		}else{
			var e=document.querySelector("#listeJoueurs .icon");
			removeClass(e,'attente');
			addClass(e,'pret');	//passage en mode pret
		}

		
	});

	// message reçu par le master lorsque tous les joueur sont prêt
	sock.on("fin",function(data){
		console.log("fin de partie");
		//alert(data);
		console.log("Le joueur "+data.joueur.pseudo+" met fin à la partie...");
		
		//TODO nettoyage
		switchPage("#accueil");



	});


	// message reçu par le master lorsque tous les joueur sont prêt
	sock.on("tour",function(data){
		console.log("On recoit un tour :");
		//alert(data);

		document.getElementById("newJeu").innerHTML=donne2html(data.tas);
		//chargement du tas
		document.getElementById("monJeu").innerHTML=donne2html(data.cartes);

		//TODO uniquement lors du premier tour.....
		var e=document.querySelector("#jeu nav .ready .icon");
		removeClass(e,'attente');
		addClass(e,'pret');	//passage en mode pret

	});


	/* fonctions */

	var switchPage = function(newpage){
		var courante = document.querySelector(pageCourante);
		//courante.style.zIndex = 0;
		courante.style.left = '-100%';
		var nouvelle = document.querySelector(newpage);
		//nouvelle.style.zIndex = 1;
		nouvelle.style.left = '0';
		pageCourante=newpage;


	}


	var donne2html = function(cartes){

		var html='<ul>';

		for (var i =0;i<cartes.length;i++) {
			html+='<li><a href="carte'+i+'" style="left:'
			+(cartes[i].x-cartes[i].r)+'%;top:'+(cartes[i].y-cartes[i].r)
			+'%;width:'+cartes[i].r*2+'%;height:'+cartes[i].r*2
			+'%;" ><img src="images/'+cartes[i].img
			+'" alt="'+i+'" style="width:100%;height:100%;transform:rotate('
			+cartes[i].orientation+'deg);" /></a></li>';
		};
		html+='</ul>';

		return html;
	}
	/****************** Partie interraction *********************/


	////gestion des différents liens
	var liens = document.querySelectorAll('a');
	for (var i = 0; i < liens.length; i++) {
	 	liens[i].addEventListener("click",function(event){
	 		event.preventDefault();
	 		var target = event.currentTarget.attributes['href'].value || '#accueil';
			console.log(target)

			if(target=="#accueil"){
				switchPage(target);
			}
			if(target=="#nouvelle_partie"){
				switchPage(target);
			}
			if(target=="#lister_parties"){
				//récuperer les parties
				sock.emit("listerParties",{});
				//TODO : afficher un sablier
			}
			if(target=="#options"){
				switchPage(target);
			}
			if(target=="creer_partie"){
				var nomJoueur = document.getElementById("nom_joueur").value;
				var nomPartie = document.getElementById("nom_partie").value;
				//TODO : vérifier la saisie
				sock.emit("creerPartie",{nomJoueur:nomJoueur,nomPartie:nomPartie});
				//TODO : afficher un sablier
			}
			if(target=="rejoindre_partie"){ //
				//TODO verifier la saisie
				var id = document.getElementById("liste_parties").value;
				sock.emit("rejoindrePartie",{id:id});
				//TODO : afficher un sablier
			}
			if(target=="#pret"){ //
				sock.emit("pret",{});
				//TODO : afficher un sablier
			}

		},false);
	}

});


/* jouons avec les classes (sans JQuery)*/
function hasClass(elem,className) {
	return new RegExp(' '+className+' ').test(' '+elem.className+' ');
}
function addClass(elem,className) {
	if (!hasClass(elem,className)) {
		elem.className+=' '+className;
	}
}
function removeClass(elem, className) {
	//on epure les classes de l'élément
	var newClass=' '+elem.className.replace(/[\t\r\n]/g,' ')+' ';
	if (hasClass(elem, className)) {
		while (newClass.indexOf(' '+className+' ')>=0) {
			newClass=newClass.replace(' '+className+' ',' ');
		}
		//mise à jour
		elem.className=newClass.replace(/^\s+|\s+$/g,'');
	}
}


if(window.addEventListener){
    window.addEventListener('load', GAME.gameStart, false);
}else{
    window.attachEvent('onload', GAME.gameStart);
}

