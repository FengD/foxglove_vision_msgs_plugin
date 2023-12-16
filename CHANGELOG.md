# vision_msg_converter version history

## 1.0.0
Add vision_msgs/msg/Detection3DArray converter

- Alpha testing

## 1.1.0
Fix the inconsistency of ros2 msg and foxglove type definition and add new features to make the visualization of bbox more clear:

- Support heading angle indicator (with arrow primitive)

- Support showing tracking id, category name as well as prediction confidence (all info only show when exists)

- Color of the bounding box indicates target's category while transparency for confidence

> Note: only Car, Headstock, Trailer, HAV and pedestrian are supported with full features mentioned above  
