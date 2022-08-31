# Using WebGL to compute heat distribution

![anim](https://user-images.githubusercontent.com/13677344/187744184-eadd840f-ac50-4a70-857a-d97a10c82534.gif)

Classical problem of heat distribution solved with WebGL shaders. Initial and calculated data are stored in texture.
There are 2 shaders here:
1. Compute shader receives texture with data and converts color of pixels form RGBA to float32 format. Then calculation performed. Finally calculated values converted back to RGBA format.
2. Display shader receives temperature as texture, converts it to float value and selects color which corresponds this value. Isolines are also drawn here.

### _*You can play with sliders and/or mouse to change the conditions*_
Please note: this will not work at mobile devices due to percision limitations. Experimentally, I have found that at mobile devices precision is limited by 3 bytes whereas at desctops we have 4 bytes precision. This will require to completely rewrite the conversion algorithm to make it work at mobile.

### How to install:
Actually, no install is required. Just copy to any server and open the index.html!
