#define BLUE_LED1 2
#define BLUE_LED2 3
#define BLUE_LED3 4
#define WHITE_LED1 11
#define WHITE_LED2 12
#define BLUE_LEDA 5
#define BLUE_LEDB 6
#define BLUE_LEDC 7
#define GREEN_LED1 8
#define GREEN_LED2 9
#define BUTTON 10
#define OFF_BUTTON 13 

bool is_off = false;


void setup() {
  pinMode(BLUE_LED1, OUTPUT);
  pinMode(BLUE_LED2, OUTPUT); 
  pinMode(BLUE_LED3, OUTPUT);
  pinMode(WHITE_LED1, OUTPUT); 
  pinMode(WHITE_LED2, OUTPUT);
  pinMode(BLUE_LEDA, OUTPUT);
  pinMode(BLUE_LEDB, OUTPUT);
  pinMode(BLUE_LEDC, OUTPUT);  
  pinMode(GREEN_LED1, OUTPUT);
  pinMode(GREEN_LED2, OUTPUT);
  pinMode(BUTTON, INPUT_PULLUP);
  pinMode(OFF_BUTTON, INPUT_PULLUP);
  Serial.begin(9600);

}
   void blink_led(int num_blinks) {
 for(int i=2; i<num_blinks; i++) {
   digitalWrite(BLUE_LED1, HIGH);
   delay(25);
   digitalWrite(BLUE_LED1, LOW);
   delay(25); 
   digitalWrite(BLUE_LED1, HIGH);
   delay(25);
   digitalWrite(BLUE_LED1, LOW);
   delay(25);
 }
   }
void fade_led(){
 for(int i=2; i<225; i+=1){
   analogWrite(BLUE_LED1, i);
   delay(0);
 }
}

void loop() 
{
  int button = digitalRead(BUTTON);
   if (button == LOW)
   {fade_led();}
   int button2 = digitalRead(OFF_BUTTON);
   if (button2 == LOW)
   {Serial.println("OFF");
    is_off = true;}
   if (is_off) {
    return;
   }
for(int i=2; i<3; i++) {
  digitalWrite(BLUE_LED1, HIGH);
   delay(1000);
   digitalWrite(BLUE_LED1, LOW);
   delay(1000); 
  int button = digitalRead(BUTTON);
   if (button == HIGH)
   {fade_led();}
}  
for(int i=2; i<3; i++) {
  digitalWrite(BLUE_LED2, HIGH);
   delay(1000);
   digitalWrite(BLUE_LED2, LOW);
   delay(1000); 
  int button = digitalRead(BUTTON);
   if (button == LOW)
   {fade_led();}
 }
        for(int i=2; i<3; i++) {
  digitalWrite(BLUE_LED3, HIGH);
   delay(1000);
   digitalWrite(BLUE_LED3, LOW);
   delay(1000); 

}
          for(int i=2; i<3; i++) {
  digitalWrite(WHITE_LED1, HIGH);
   delay(1500);
   digitalWrite(WHITE_LED1, LOW);
   delay(1500); 

  int button = digitalRead(BUTTON);
   if (button == LOW)
   {fade_led();}
}
          for(int i=2; i<3; i++) {
  digitalWrite(WHITE_LED2, HIGH);
   delay(1500);
   digitalWrite(WHITE_LED2, LOW);
   delay(1500); 
  int button = digitalRead(BUTTON);
   if (button == LOW)
   {fade_led();}
}
            for(int i=2; i<3; i++) {
  digitalWrite(BLUE_LEDA, HIGH);
   delay(1000);
   digitalWrite(BLUE_LEDA, LOW);
   delay(1000); 
  int button = digitalRead(BUTTON);
   if (button == LOW)
   {fade_led();}
}
              for(int i=2; i<3; i++) {
  digitalWrite(BLUE_LEDB, HIGH);
   delay(1000);
   digitalWrite(BLUE_LEDB, LOW);
   delay(1000); 

  int button = digitalRead(BUTTON);
   if (button == LOW)
   {fade_led();}
                              for(int i=2; i<3; i++) {
  digitalWrite(BLUE_LEDC, HIGH);
   delay(1000);
   digitalWrite(BLUE_LEDC, LOW);
   delay(1000); 

  int button = digitalRead(BUTTON);
   if (button == LOW)
   {fade_led();}
}
  for(int i=2; i<3; i++) {
  digitalWrite(GREEN_LED1, HIGH);
   delay(1500);
  digitalWrite(GREEN_LED1, LOW); 
  delay(1500);
  int button = digitalRead(BUTTON);
   if (button == LOW)
   {fade_led();}
  
  }

    for(int i=2; i<3; i++) {
  digitalWrite(GREEN_LED2, HIGH);
   delay(1500);
   digitalWrite(GREEN_LED2, LOW);
   delay(1500); 
  int button = digitalRead(BUTTON);
   if (button == LOW)
   {fade_led();}
}
 
}
}
