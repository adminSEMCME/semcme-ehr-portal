window.InitUserScripts = function()
{
var player = GetPlayer();
var object = player.object;
var once = player.once;
var addToTimeline = player.addToTimeline;
var setVar = player.SetVar;
var getVar = player.GetVar;
var update = player.update;
var pointerX = player.pointerX;
var pointerY = player.pointerY;
var showPointer = player.showPointer;
var hidePointer = player.hidePointer;
var slideWidth = player.slideWidth;
var slideHeight = player.slideHeight;
window.Script1 = function()
{
  const menus = {}; 

//ADD YOUR MENUS BELOW
menus.menu1 = "*Levothyroxine";
menus.menu2 = "112 mcg|*125 mcg| 137 mcg| 150 mcg| 175 mcg";
menus.menu3 = "*1|2|3";
menus.menu4 = "30|60|*90";
menus.menu5 = "0|1|2|*3";
menus.menu6 = "*1|2|3";
//ADD YOUR MENUS ABOVE

// Setting a variable 'allCorrect' to false initially
GetPlayer().SetVar('allCorrect', false);

// Getting all elements with 'data-acc-text' attribute starting with 'menu'
const menuWrappers = document.querySelectorAll('[data-acc-text^="menu"]');

// Iterating through each menu wrapper
menuWrappers.forEach(function (menuWrapper, i) {

  // Allowing pointer events on the menu wrapper
  menuWrapper.style["pointer-events"] = "auto";

  // Determining the menu index
  const menuIndex = i + 1;

  // Constructing the id of the menu
  const menuId = 'menu' + menuIndex;

  // Constructing the HTML for the select element
  let html = '<select id="'+menuId+'" class="knowledge-check-menu" data-correct="" onchange="window.evaluateMenu(\''+menuId+'\')" style="font-size: 14px; border-radius: 6px;"><option>Select</option>';

  // Splitting the menu options
  const menuOptions = menus[menuId].split('|');

  // Iterating through each option
  menuOptions.forEach(function (option) {

    // If the option is correct, remove the '*' and update the data-correct attribute of the select menu
    if (option.indexOf('*')===0) {
      option = option.replace('*','');
      html = html.replace('data-correct=""','data-correct="'+option+'"');
    }

    // Adding each option to the HTML

    html += '<option value="'+option+'">' + option + '</option>';

  });

  // Closing the select element and adding feedback span

  html += '</select>';

  html += '<span id="'+menuId+'-feedback" style="font-size: 20px;"></span>';

  // Setting the constructed HTML to the menu wrapper
  document.querySelector('[data-acc-text="'+menuId+'"]').innerHTML = html;
});


// Function to evaluate the selected menu option
window.evaluateMenu = function(menuId){
  const menu = document.getElementById(menuId);

  // If the selected option is correct
  if (menu.value === menu.getAttribute('data-correct')) {

    // Add styles for correct option and disable the menu
    menu.classList.add('menu-incorrect');
    menu.classList.add('menu-correct');
    menu.style.color = "black";
    menu.style.border = '1px solid black';
    
  }

 

  // If all menus are correctly answered, set 'allCorrect' to true

  if (document.querySelectorAll('.knowledge-check-menu').length === document.querySelectorAll('.menu-correct').length) {
    GetPlayer().SetVar('allCorrect', true);
  }
}

}

window.Script2 = function()
{
  const menus = {}; 

//ADD YOUR MENUS BELOW
menus.menu1 = "*1 view (including portable)|2 views (routine)|2 views with oblique projection";
menus.menu2 = "Routine|*STAT";
menus.menu3 = "Chest Pain|Cough|Dyspnea|Fever|*Respiratory Failure|Trauma";

//ADD YOUR MENUS ABOVE

// Setting a variable 'allCorrect' to false initially
GetPlayer().SetVar('allCorrect', false);

// Getting all elements with 'data-acc-text' attribute starting with 'menu'
const menuWrappers = document.querySelectorAll('[data-acc-text^="menu"]');

// Iterating through each menu wrapper
menuWrappers.forEach(function (menuWrapper, i) {

  // Allowing pointer events on the menu wrapper
  menuWrapper.style["pointer-events"] = "auto";

  // Determining the menu index
  const menuIndex = i + 1;

  // Constructing the id of the menu
  const menuId = 'menu' + menuIndex;

  // Constructing the HTML for the select element
  let html = '<select id="'+menuId+'" class="knowledge-check-menu" data-correct="" onchange="window.evaluateMenu(\''+menuId+'\')" style="font-size: 20px; border-radius: 6px;"><option>Select One</option>';

  // Splitting the menu options
  const menuOptions = menus[menuId].split('|');

  // Iterating through each option
  menuOptions.forEach(function (option) {

    // If the option is correct, remove the '*' and update the data-correct attribute of the select menu
    if (option.indexOf('*')===0) {
      option = option.replace('*','');
      html = html.replace('data-correct=""','data-correct="'+option+'"');
    }

    // Adding each option to the HTML

    html += '<option value="'+option+'">' + option + '</option>';

  });

  // Closing the select element and adding feedback span

  html += '</select>';

  html += '<span id="'+menuId+'-feedback" style="font-size: 20px;"></span>';

  // Setting the constructed HTML to the menu wrapper
  document.querySelector('[data-acc-text="'+menuId+'"]').innerHTML = html;
});


// Function to evaluate the selected menu option
window.evaluateMenu = function(menuId){
  const menu = document.getElementById(menuId);

  // If the selected option is correct
  if (menu.value === menu.getAttribute('data-correct')) {

    // Add styles for correct option and disable the menu
    menu.classList.remove('menu-incorrect');
    menu.classList.add('menu-correct');
    menu.style.color = "green";
    menu.style.border = '1px solid green';
    menu.disabled =true;

    // Provide feedback
    document.getElementById(menuId+"-feedback").innerHTML = "✅";
  }

  else {

    // Add styles for incorrect option
    menu.classList.remove('menu-correct');
    menu.classList.add('menu-incorrect');
    menu.style.color = "black";
    menu.style.border = '1px solid black';

    // Provide feedback
    document.getElementById(menuId+"-feedback").innerHTML = "❌";
  }

  // If all menus are correctly answered, set 'allCorrect' to true

  if (document.querySelectorAll('.knowledge-check-menu').length === document.querySelectorAll('.menu-correct').length) {
    GetPlayer().SetVar('allCorrect', true);
  }
}

}

};
