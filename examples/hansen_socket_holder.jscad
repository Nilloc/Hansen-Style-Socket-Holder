// title      : Hansen Style Socket Holder
// author     : Collin Reisdorf
// license    : MIT License
// revision   : 0.005
// tags       : Tools,Sockets,Boolean
// file       : hansen_style_socket_holder.jscad

function getParameterDefinitions () {
  return [
    { name: 'baseSettings', type: 'group', caption: 'Base Settings' },
    { name: 'socketBaseHeight', caption: 'Socket base height:', type: 'int', initial: 8, min: 5, max: 20, step: 1 },
    { name: 'socketBaseBevelSize', caption: 'Socket base bevel size:', type: 'float', initial: 1.5, step:0.25 },
    { name: 'socketBasePaddingSide', caption: 'Base Side Padding:', type: 'int', initial: 5, step:1 },
    { name: 'baseWidth', caption: 'Base min-width:', type: 'int', initial: 30, step:5 },
    { name: 'socektSettings', type: 'group', caption: 'Sockets to build' },
    { name: 'sockets', caption: 'List of Sockets:', type:'text', initial:'[{"driver":"1/4", "size":10, "length":30, "od":20},{"driver":"1/4", "size":11, "length":30, "od":20}]'},
    { name: 'socketTolerance', caption:'Socket Tolerance (mm)', type:'float', initial:0.5, step:0.1, min:0, max:2},
    // { name: 'labelStyle', caption: 'Label style [extruded (default), embossed, none]:', type: 'text', initial:'extruded'}
  ];
}


function main (params) {

let sockets = [
{"driver":"1/4", "size":10, "length":30, "od":20},
{"driver":"1/4", "size":11, "length":30, "od":20}, 
{"driver":"1/4", "size":"3/8", "length":80, "od":24, "label":"3\n-\n8"},
];

try{
  sockets = JSON.parse(params.sockets);
  console.log('params', params.sockets, tester );
}catch(error){
  //alert("Something is wrong with your Sockets JSON list, take a look again or try validating it online.");
}

// console.log('editor', this.document.querySelector('#instantUpdate').value)

let trayLabel = false; //"1/2 Deep Impact";
// TODO: add units to sockets array for metric/standard conversion
let socketBaseHeight = params.socketBaseHeight || 8;
let socketBaseBevelSize = params.socketBaseBevelSize || 1.5;
let spacingX = 12;
// let spacingY = 50;
let offsetX = 0;
let offsetY = 0;
let socketTolerance = params.socketTolerance || 0.5;
let postTolerance = 23; //25.4 would be no tolerance
let baseThickness = 5;
let baseWidth = params.baseWidth || 50; //TODO: Make this based on widest socket!
let maxBaseWidth = 300;
let models = [];
// TODO: Add another level to the arrays for rows of tools.
  for(var i=0; i < sockets.length; i++){
    // need to handle fractions and convert to numbers safely
    let socketLabel = String(sockets[i].label) || (String(sockets[i].size).indexOf('/') > -1) ? String(sockets[i].size).split('/').join('\n-\n') : sockets[i].size;
    
    sockets[i].driver = (String(sockets[i].driver).indexOf('/') < 0) ? parseFloat(sockets[i].driver) : sockets[i].driver.split('/')[0]/sockets[i].driver.split('/')[1]; //eval(sockets[i].driver); // I know about the evals...
    sockets[i].size = (String(sockets[i].size).indexOf('/') < 0) ? parseFloat(sockets[i].size) : sockets[i].size.split('/')[0]/sockets[i].size.split('/')[1]; //eval(sockets[i].size);
    sockets[i].length = (sockets[i].length && String(sockets[i].length).indexOf('/') < 0) ? parseFloat(sockets[i].length) : sockets[i].length.split('/')[0]/sockets[i].length.split('/')[1]; //eval(sockets[i].length);
    sockets[i].od = (sockets[i].od && String(sockets[i].od).indexOf('/') < 0) ? parseFloat(sockets[i].od) : sockets[i].od.split('/')[0]/sockets[i].od.split('/')[1]; //eval(sockets[i].od);
    
    // Everything should get metric here
    let socketLength = sockets[i].length; //TODO: make this get metric too
    let socketSize = (sockets[i].size < 3) ? (sockets[i].size * postTolerance) - socketTolerance : sockets[i].size - socketTolerance;
    let driverSize = (sockets[i].driver * postTolerance < socketSize) ? sockets[i].driver * postTolerance : socketSize - 2;
    
    // Makes the socket.od at least as wide as the size plus padding to keep it on the base.
    if( sockets[i].od <  sockets[i].size)  sockets[i].od =  sockets[i].size + ((socketBaseBevelSize+baseThickness) * 2);

    //TODO: Add ID too for minimum inner diameter for stubborn sockets with little holes.
    
    offsetX += sockets[i].od/2;//sockets[i].size + spacingX;
    // if(offsetX >= 300){
    //   offsetX = 0;
    //   offsetY += spacingY;
    // }
    
    // Make size label
    let sizeText =  extrudeText(
                        socketLabel, //text
                        ((socketLabel.indexOf('-') > -1) ? 5.5 : 7) * (driverSize / postTolerance),            //size (smaller if fraction!)
                        (((socketLabel.indexOf('-') > -1) ? 2 : 2.5) * (driverSize/postTolerance)),          //weight
                        1,                                           //height
                        (String(sockets[i].label || sockets[i].size).indexOf('1') > -1) ? 0.75 : 1 // letterspacing to fix gaps after 1 (felt cute, might delete later)
                    );
                    
    let textBounds = sizeText.getBounds();
    // console.log('"'+sockets[i].size+'"', 'y0', textBounds[0].y, 'y1', textBounds[1].y, Math.abs(textBounds[1].y) + Math.abs(textBounds[0].y), 'x0', textBounds[0].x, 'x1', textBounds[1].x, Math.abs(textBounds[1].x) + Math.abs(textBounds[0].x));
    
    let post = union(
        difference(
            cylinder({fn:64, d:driverSize, h:(socketLength + 12)}),
            rotate([45,0,0], cube({size:26}))
                .translate([-13,-8,(socketLength + 10) - 13])
        ),
        
        union(
            cylinder({fn:64, d1:socketSize, d2:driverSize, h:(socketBaseHeight / 3)}).translate([0,0,socketBaseHeight]),
            cylinder({fn:64, d1:socketSize*0.75, d2:driverSize, h:(socketBaseHeight / 2)}).translate([0,0,socketBaseHeight]),
            cylinder({fn:64, d1:socketSize*0.5, d2:driverSize, h:(socketBaseHeight/1.5)}).translate([0,0,socketBaseHeight]),
            cylinder({fn:64, d:socketSize, h:socketBaseHeight}),
            cylinder({fn:64, d1:socketSize + (socketBaseBevelSize * 1), d2:socketSize, h:socketBaseBevelSize * 1.5}),
            cylinder({fn:64, d1:socketSize + (socketBaseBevelSize * 2), d2:socketSize, h:socketBaseBevelSize}),
            cylinder({fn:64, d1:socketSize + (socketBaseBevelSize * 3), d2:socketSize, h:socketBaseBevelSize / 2}),
            rotate([45,0,0], 
                sizeText.translate([
                    -(textBounds[0].x + textBounds[1].x)/2, //(0 - textBounds[0].x) - (textBounds[0].x + textBounds[1].x)/2,
                    //(Math.abs(textBounds[1].y) + Math.abs(textBounds[0].y)/2) - 4, //3 - (textBounds[1].y + textBounds[0].y),// -3 * driverSize/postTolerance, //(textBounds[0].y - textBounds[1].y)/-4,
                    -(textBounds[0].y) - (Math.abs(textBounds[0].y - textBounds[1].y)/2),
                    0
                ])
            ).translate(
                [
                    0, // (sizeText.getBounds()[0].x - sizeText.getBounds()[1].x)/2,
                    0, //-3 * driverSize/postTolerance,
                    (socketLength + 5)//(3.25))
                ]
            )
        )
        // TODO: Wrap if max width is achieved
      ).translate([offsetX,offsetY,baseThickness]);
      
    // let testText = sizeText.translate([
    //     (57 + (10*i)) - ((textBounds[0].x + textBounds[1].x)/2),// - (Math.abs(textBounds[1].x) + Math.abs(textBounds[0].x)/2),
    //     // (42.5-textBounds[0].y) - (Math.abs(textBounds[1].y) + Math.abs(textBounds[0].y)/2),
    //     (42.5-textBounds[0].y) - (Math.abs(textBounds[0].y - textBounds[1].y)/2),
    //     0
    // ]);
    offsetX += sockets[i].od/2; // add the other half of the offset
    
    if(sockets[i].od > baseWidth) baseWidth = sockets[i].od;
    
    models.push(post);
    //models.push(testText);
  }
  let base = cube({
      size:[offsetX + (params.socketBasePaddingSide * 2), baseWidth, baseThickness*2], 
    //   size:[offsetX, baseWidth, baseThickness*2], 

      center:true, 
      radius:baseThickness/2, 
      fn:24, 
      round:true
  }).translate([(offsetX / 2),0,0]);
  let baseCut = cube({
      size:[offsetX + (params.socketBasePaddingSide * 2), baseWidth, baseThickness*2], 
      center:true
  }).translate([(offsetX / 2),0, baseThickness * -1]);
  if(trayLabel){
    let trayLabelText = extrudeText(trayLabel, 3, 1, 5).translate([-8,-20,baseThickness - 1]);  
    base = difference(base, trayLabelText);
  }
//   let h = hull(square(10), translate([5, 10, 15], circle(10)));
//   console.log("hull", h, "\n\tcube", cube(10))
  models.push(difference(base, baseCut));
  
  return union(models).translate([(offsetX / -2),0,0]);
}


function extrudeText(textToExtrude, size, thickness, height, letterSpacing, lineSpacing, textAlign){
    let extrudedText = [];
    // Added letterspacing hack for kerning numbers with a 1!
    let text = vectorText(
      { height:size || 5, //(textToExtrude.indexOf('-') > -1) ? size*0.75 : size, 
        align:textAlign || 'center', 
        letterSpacing:letterSpacing || 1,
        lineSpacing:lineSpacing || 1.25
      }, 
      textToExtrude
    );
    for(var seg = 0; seg < text.length; seg++){
      let segment = rectangular_extrude(text[seg],
        {w:thickness || 1, h:height || 1, fn:64, closed:false});
      extrudedText.push(segment);
    }
    
    return union(extrudedText);
}