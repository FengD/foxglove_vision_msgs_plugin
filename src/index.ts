import { ExtensionContext } from "@foxglove/studio";
import { CubePrimitive, ArrowPrimitive, TextPrimitive, SceneUpdate } from "@foxglove/schemas";
//import { std_msgs } from "@foxglove/rosmsg-msgs-common";
import { Time } from "@foxglove/schemas/schemas/typescript/Time";

type Header = {
  seq: number;
  stamp: Time;
  frame_id: string;
};

type Point = {
  x: number;
  y: number;
  z: number;
};

type Quaternion = {
  x: number;
  y: number;
  z: number;
  w: number;
};

type Pose = {
  position: Point;
  orientation: Quaternion;
};

type Vector3 = {
  x: number;
  y: number;
  z: number;
};

type BoundingBox3D = {
  center: Pose;
  size: Vector3;
};

type PoseWithCovariance = {
  pose: Pose;
  covariance: number[];
};

type ObjectHypothesis = {
  class_id: string;
  score: number;
}

type ObjectHypothesisWithPose = {
  hypothesis: ObjectHypothesis;
  pose: PoseWithCovariance;
};

type Detection3D = {
  header: Header;
  results: ObjectHypothesisWithPose[];
  bbox: BoundingBox3D;
  id: string;
};


type Detection3DArray = {
  header: Header;
  detections: Detection3D[];
};

export function activate(extensionContext: ExtensionContext) {
  extensionContext.registerMessageConverter({
    fromSchemaName: "vision_msgs/msg/Detection3DArray",
    toSchemaName: "foxglove.SceneUpdate",
    converter: (inputMessage: Detection3DArray): SceneUpdate => {
  const { header, detections } = inputMessage;
  const colorMap = [
    { r: 1, g: 0, b: 0, a: 1 },
    { r: 1, g: 0.647, b: 0, a: 1 },
    { r: 1, g: 1, b: 0, a: 1 },
    { r: 0, g: 1, b: 0, a: 1 },
    { r: 0, g: 0.498, b: 1, a: 1 },
    { r: 0, g: 0, b: 1, a: 1 },
    { r: 0.545, g: 0, b: 1, a: 1 },
  ];
  // note: add new class mapping when necessary
  const classMap: {[key: string]: number} = {
    Car: 0,
    Headstock: 1,
    Trailer: 2,
    HAV: 3,
    Pedestrian: 4,
  };

  var cubes = [];       // bounding boxes
  var dirs = [];        // use arrow to indicate target heading
  var annos = [];       // text description for each target
  for (var detection of detections) {
    var category = "";
    var class_idx = 0;
    var score = 1;
    if (detection.results[0]) {
      category = detection.results[0].hypothesis.class_id;
      class_idx = classMap[category] || 0;
      score = Number(detection.results[0].hypothesis.score);
    }
    var color = colorMap[class_idx] || { r: 1, g: 0, b: 0, a: 1 };
    color.a = ((score >= 0.35)?score:0.35);
    color.a = ((score <= 0.6)?score:0.6);

    const orientation = detection.bbox.center.orientation;
    const cube: CubePrimitive = {
      pose: {
        position: { 
          x: detection.bbox.center.position.x,
          y: detection.bbox.center.position.y,
          z: detection.bbox.center.position.z
        },
        orientation: orientation,
      },
      size: {
        x: detection.bbox.size.x,
        y: detection.bbox.size.y,
        z: detection.bbox.size.z
      },
      color: color,
    };
    cubes.push(cube);

    const dir: ArrowPrimitive = {
      pose: {
        position: { 
          x: detection.bbox.center.position.x,
          y: detection.bbox.center.position.y,
          z: detection.bbox.center.position.z + detection.bbox.size.z / 2 + 1,
        },
        orientation: orientation,
      },
      shaft_length: (detection.bbox.size.x <= 5) ? (detection.bbox.size.x / 2) : 2.5,
      shaft_diameter: 0.5,
      head_length: (detection.bbox.size.x > 2) ? 0.5 : (detection.bbox.size.x / 2),
      head_diameter: 0.8,
      color: color,
    };
    dirs.push(dir);

    var anno_list = [];
    if (detection.id.length != 0) {
      anno_list.push("[".concat(detection.id).concat(']'));
    }
    if (detection.results[0]) {
      if (category.length != 0) {
        anno_list.push(category);      // currently category name
      }
      if (score < 1 && score > 0) {
        anno_list.push(String(score.toFixed(2)));   // pred score
      }
    }
    var anno_text = anno_list.join("");
    const anno: TextPrimitive = {
      pose: {
        position: { 
          x: detection.bbox.center.position.x,
          y: detection.bbox.center.position.y,
          z: detection.bbox.center.position.z + detection.bbox.size.z / 2 + 3,
        },
        orientation: orientation,
      },
      billboard: true,
      font_size: 1,
      scale_invariant: false,
      color: color,
      text: anno_text,
    };
    annos.push(anno);
  }

  const sceneUpdateMessage = {
    deletions: [],
    entities: [{
        id: "Object",
        timestamp: header.stamp,
        frame_id: header.frame_id,
        lifetime: { sec: 0, nsec: 100000000 },
        frame_locked: false,
        metadata: [],
        arrows: dirs,
        cubes: cubes,
        spheres: [],
        cylinders: [],
        lines: [],
        triangles: [],
        texts: annos,
        models: [],
      }],
  };

  return sceneUpdateMessage;
    },
  });


}


