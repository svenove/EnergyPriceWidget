## Intro
This widget is not dependent of having a particular energy provider (unlike my [iOSTibberWidget](https://github.com/svenove/iOSTibberWidget/)).

Data is fetched from a free API, which does not require any registration/user account/API-key/etc.

<a href="https://www.hvakosterstrommen.no"><img src="https://ik.imagekit.io/ajdfkwyt/hva-koster-strommen/strompriser-levert-av-hvakosterstrommen_oTtWvqeiB.png" alt="Strømpriser levert av Hva koster strømmen.no" width="200" height="45"></a>

## Here is the procedure
1. Download the "Scriptable" app: https://apps.apple.com/no/app/scriptable/id1405459188
2. Start the app, press the "+" in the top right corner
3. Press the text "Untitled Scripts" at the very top and change the name to "EnergyPriceWidget".
4. Paste the code from [EnergyPriceWidget.js](/EnergyPriceWidget.js?raw=1) into "EnergyPriceWidget" in Scriptable
      <img src="/widget.jpg" width="500px" />
5. In the script, set the correct zone and set the value for øre/kWh your power company charges in addition to the spot price from Nord pool.
6. Close the "Scriptable" app and press and hold on the home screen where you want the widget (so the apps start "shaking"), press the "+" on the top left, select "Scriptable". Choose large widget and press "Add widget".
7. Widget is now there with "Select script in widget configurator". Tap and hold on it and select "Edit Widget".
8. For "Script", select "EnergyPriceWidget"

 Widget is now ready to use! :) 

## What countries are supported?
Norway, Sweden and Denmark.

## Widget for lock screen
This is on the TODO-list. If you're a developer, feel free to code it and create a PR! :)

## Input, issues or other discussions
Feel free to make suggestions for changes or share your own improvements!

Use Github or join the Norwegian home automation community [here](https://www.hjemmeautomasjon.no/forums/topic/11265-ios-widget-for-str%C3%B8mpris-uavhengig-av-str%C3%B8mleverand%C3%B8r/) (english posts also welcome).

## Hey, advanced users!
If you want to edit and test your scripts on a computer and happen to have a Mac, you can try the [Scriptable Beta for Mac](https://scriptable.app/mac-beta/).
