function ExecuteScript(strId)
{
  switch (strId)
  {
      case "5e1jEKQXAP4":
        Script1();
        break;
      case "67ONALz05or":
        Script2();
        break;
      case "6CB8Tn9DQGV":
        Script3();
        break;
  }
}

window.InitExecuteScripts = function()
{
var player = GetPlayer();
var object = player.object;
var addToTimeline = player.addToTimeline;
var setVar = player.SetVar;
var getVar = player.GetVar;
window.Script1 = function()
{
  const target = object('6dr2Iq3zI5g');
const duration = 750;
const easing = 'ease-out';
const id = '63o2kB3PV7H';
const growAmount = 0.2;
player.addForTriggers(
id,
target.animate([
{ scale: `${1 + growAmount}` }
],
  { fill: 'forwards', duration, easing }
)
);
}

window.Script2 = function()
{
  const target = object('5n3FawUi1JT');
const duration = 750;
const easing = 'ease-out';
const id = '63o2kB3PV7H';
const growAmount = 0.2;
player.addForTriggers(
id,
target.animate([
{ scale: `${1 + growAmount}` }
],
  { fill: 'forwards', duration, easing }
)
);
}

window.Script3 = function()
{
  const target = object('6ZTxwi3yTGZ');
const duration = 750;
const easing = 'ease-out';
const id = '63o2kB3PV7H';
const growAmount = 0.2;
player.addForTriggers(
id,
target.animate([
{ scale: `${1 + growAmount}` }
],
  { fill: 'forwards', duration, easing }
)
);
}

};
