import React, { useState, useEffect, useRef } from 'react';
import LinearRing from 'ol/geom/LinearRing';
import { Map, View } from 'ol';
import Projection from 'ol/proj/Projection';
import {getCenter} from 'ol/extent';
import ImageLayer from 'ol/layer/Image';
import Static from 'ol/source/ImageStatic';
import {Draw, Modify, Select} from 'ol/interaction';
import {Fill, Stroke, Style} from 'ol/style'
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { click, pointerMove } from 'ol/events/condition';
import 'ol/ol.css';
import './App.css';
import { Polygon } from 'ol/geom';

function App() {
  const [map, setMap] = useState<Map | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const source = new VectorSource();
  useEffect(() => {
    const vector = new VectorLayer({
      source : source,
      style : new Style({
          fill : new Fill({
              color : 'rgba(255, 255, 255, 0.2)',
          }),
          stroke : new Stroke({
              color : '#ffcc33',
              width : 2,
          })
      })
  })
    const img = new Image();
    img.src = 'https://i.imgur.com/6XAw0Xd.png';
    const height = img.height;
    const width = img.width;
    const extent = [0, 0, width, height];
    const projection = new Projection({
      code : '',
      units : 'pixels',
      extent : extent,
    })
    const mapOptions = {
      layers : [
        new ImageLayer({
          source : new Static({
            attributions : 'Imagery ©2022 CNES/Airbus, MassGIS, Commonwealth of Massachusetts EOEA, Maxar Technologies, U.S. Geological Survey, USDA/FPAC/GEO, Map data ©2022',
            url : img.src,
            projection : projection,
            imageExtent : extent,
          })
        }),
        vector,
      ],
      view : new View({
        projection : projection,
        center : getCenter(extent),
        zoom : 2,
      }),
    };
    const initialMap = new Map(mapOptions);
    initialMap.setTarget(mapRef.current ?? undefined);
    let modify = new Modify({source : source});
    let selectedStyle = new Style({
      fill : new Fill({
        color : 'rgba(238, 238, 238, 0.7)',
      }),
      stroke : new Stroke({
        color: 'rgba(255, 255, 255, 0.7)',
        width: 2,
      }),
    })
    let selectClick = new Select({
      condition : click,
      style : selectedStyle,
    })
    let selectHover = new Select({
      condition : pointerMove,
      style : selectedStyle,
    })
    let draw = new Draw({
      source : source,
      type : 'Polygon',
    })
    let draw2 = new Draw({
      source : source,
      type : 'Polygon',
    })
    let intersection : any;
    let coordinate_length : any;
    function onDrawStart(e:any) {
      vector.getSource()!.forEachFeatureIntersectingExtent(e.feature.getGeometry().getExtent(), function(feature) {
        intersection = feature;
      })
      if (!intersection) {
        e.target.abortDrawing();
        return;
      }
      coordinate_length = intersection.getGeometry().getCoordinates().length;
      e.feature.getGeometry().on('change', function(e: any) {
        let linearRing = new LinearRing(e.target.getCoordinates()[0]);
        let coordinates = intersection.getGeometry().getCoordinates();
        let geometry = new Polygon(coordinates.slice(0, coordinate_length));
        geometry.appendLinearRing(linearRing);
        intersection.setGeometry(geometry);
      }); 
    }
    function onDrawEnd(e:any) {
      setTimeout(() => {
        vector.getSource()!.removeFeature(e.feature);
      }, 1);
      intersection = undefined;
      coordinate_length = undefined;
    }
    function beginDraw() {
      initialMap.addInteraction(draw);
      initialMap.removeInteraction(selectHover);
      initialMap.removeInteraction(modify);
      initialMap.removeInteraction(selectClick);
      initialMap.removeInteraction(draw2);
    }
    function holeDraw() {
      initialMap.addInteraction(draw2);
      initialMap.removeInteraction(draw);
      initialMap.removeInteraction(selectHover);
      initialMap.removeInteraction(modify);
      initialMap.removeInteraction(selectClick);
      draw2.on('drawstart', onDrawStart);
      draw2.on('drawend', onDrawEnd)
    }
    function stopDraw() {
      initialMap.removeInteraction(selectHover);
      initialMap.removeInteraction(draw);
      initialMap.removeInteraction(draw2);
      initialMap.removeInteraction(modify);
      initialMap.removeInteraction(selectClick);
    }
    function modifyDraw() {
      initialMap.addInteraction(modify); 
      initialMap.removeInteraction(draw);
      initialMap.removeInteraction(draw2);
      initialMap.removeInteraction(selectClick);
      initialMap.removeInteraction(selectHover);
    }
    function removeDraw() {
      initialMap.addInteraction(selectClick);
      selectClick.on('select', function (e) {
        e.target.getFeatures().forEach(function(feature:any) {
          vector.getSource()!.removeFeature(feature);
        })
      })
    }
    function hoverDraw() {
      initialMap.addInteraction(selectHover);
      initialMap.removeInteraction(modify);
      initialMap.removeInteraction(draw);
      initialMap.removeInteraction(draw2);
    }
    function clearDraw() {
      vector.getSource()!.clear();
      initialMap.removeInteraction(selectHover);
      initialMap.removeInteraction(draw);
      initialMap.removeInteraction(modify);
      initialMap.removeInteraction(selectClick);
      initialMap.removeInteraction(draw2);
    }
    document.getElementById('Draw')!.addEventListener("click", beginDraw);
    document.getElementById('Hole')!.addEventListener("click", holeDraw);
    document.getElementById('Stop')!.addEventListener("click", stopDraw);
    document.getElementById('Modify')!.addEventListener("click", modifyDraw);
    document.getElementById('Delete')!.addEventListener("click", removeDraw);
    document.getElementById('Delete')!.addEventListener("mouseover", hoverDraw);
    document.getElementById('Clear')!.addEventListener("click", clearDraw);
    setMap(initialMap);
  }, [])

  return (
    <div style={{height:'100vh',width:'100%'}} ref={mapRef} className="map-container">
    <button className = "button" id = "Draw">Draw Polygon!</button>
    <button className = "button" id = "Hole">Draw Holes!</button>
    <button className = "button" id = "Stop">Stop Drawing!</button>
    <button className = "button" id = "Modify">Modify Polygon!</button>
    <button className = "button" id = "Delete">Delete Polygon!</button>
    <button className = "button" id = "Clear">Clear Polygon(s)!</button>
  </div>
  );
}

export default App;
