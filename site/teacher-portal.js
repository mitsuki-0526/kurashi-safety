const collector='https://safety-home-connection-check.proud-bow-6894.chatgpt.site';
const game=new URL('./',location.href);game.search='';game.hash='';
const target=new URL('/game-teacher',collector);target.search=new URLSearchParams({gameUrl:game.href}).toString();
document.getElementById('manage').href=target.href;
