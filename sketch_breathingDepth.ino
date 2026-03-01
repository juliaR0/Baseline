#include <NewPing.h>

#define WHITE_LED 9
#define ULTRASONIC_TRIGGER 12
#define ULTRASONIC_ECHO 11
#define BUTTON 4

#define MAX_DISTANCE 30 

NewPing sonar(ULTRASONIC_TRIGGER, ULTRASONIC_ECHO, MAX_DISTANCE);

int triggerDistance = 0;
bool triggerSet = false;

void setup() {
  pinMode(WHITE_LED, OUTPUT);
  pinMode (BUTTON, INPUT_PULLUP);
  Serial.begin(9600);
}

void loop() {
  delay(50);
  
  unsigned int distance = sonar.ping_cm(); 
  float distance = duration /58.0
  // Fix Y-axis from 0 to 30
  Serial.print(10);          // Minimum Y value
  Serial.print(" ");
  Serial.print(MAX_DISTANCE); // Maximum Y value
  Serial.print(" ");
  Serial.println(distance, 1); 

  if(digitalRead(BUTTON) == LOW && !triggerSet && distance> 0) {
    triggerDistance = distance + 0.5; 
    triggerSet = true;

    Serial.print("Trigger set: ");
    Serial.println(triggerDistance, 1);

    delay(300);

  }

  if (distance > 0 && distance <= triggerDistance) {
    digitalWrite(WHITE_LED, HIGH);  // Turn LED ON
  } 
  else {
    digitalWrite(WHITE_LED, LOW);   // Turn LED OFF
  }

  
}



