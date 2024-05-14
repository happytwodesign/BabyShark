import pygame
import sys
import random

# Initialize pygame
pygame.init()

# Screen dimensions and settings
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 600
FPS = 60
PIPE_HEIGHT = 150  # Adjust based on your desired pipe height
PIPE_WIDTH = 80

# Colors
WHITE = (255, 255, 255)  # Make sure this is defined at the global level
SKY_BLUE = (135, 206, 235)

# Game parameters
GRAVITY = 0.25
FLAP_POWER = -5
PIPE_SPEED = 2  # Slower pipe speed
PIPE_GAP = 200
PIPE_FREQUENCY = 2000  # Decreased frequency for more pipes
LAST_PIPE = pygame.time.get_ticks()

# Set up the screen
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
pygame.display.set_caption("Flappy Baby Shark")

# Load images
try:
    baby_shark_img = pygame.image.load("baby_shark.png").convert_alpha()
    background_img = pygame.image.load("background.png").convert()
    jellyfish_img = pygame.image.load(
        "jellyfish.png"
    ).convert_alpha()  # Jellyfish image for pipes
    jellyfish_img = pygame.transform.scale(
        jellyfish_img, (PIPE_WIDTH, PIPE_HEIGHT)
    )  # Scale the jellyfish image
except:
    print("Error: Unable to load one or more images.")
    sys.exit()

# Scale images
baby_shark_img = pygame.transform.scale(baby_shark_img, (80, 40))
background_img = pygame.transform.scale(background_img, (SCREEN_WIDTH, SCREEN_HEIGHT))

# Clock
clock = pygame.time.Clock()

# Background position variables for continuous scrolling
background_x1 = 0
background_x2 = SCREEN_WIDTH


class BabyShark:
    def __init__(self):
        self.image = baby_shark_img
        self.rect = self.image.get_rect(center=(100, SCREEN_HEIGHT // 2))
        self.velocity = 0

    def update(self):
        self.velocity += GRAVITY
        self.rect.y += self.velocity

        if self.rect.top <= 0:
            self.rect.top = 0
        if self.rect.bottom >= SCREEN_HEIGHT:
            self.rect.bottom = SCREEN_HEIGHT

    def flap(self):
        self.velocity = FLAP_POWER

    def draw(self):
        screen.blit(self.image, self.rect)


class Pipe:
    def __init__(self, inverted, y):
        self.image = jellyfish_img
        self.rect = self.image.get_rect()
        if inverted:
            self.rect.bottomleft = (SCREEN_WIDTH, y - PIPE_GAP // 2)
        else:
            self.rect.topleft = (SCREEN_WIDTH, y + PIPE_GAP // 2)

    def update(self):
        self.rect.x -= PIPE_SPEED

    def draw(self):
        screen.blit(self.image, self.rect)


class PipePair:
    def __init__(self):
        self.passed = False
        gap_y = random.randint(100, SCREEN_HEIGHT - 100)
        self.top_pipe = Pipe(True, gap_y)
        self.bottom_pipe = Pipe(False, gap_y)

    def update(self):
        self.top_pipe.update()
        self.bottom_pipe.update()

    def draw(self):
        self.top_pipe.draw()
        self.bottom_pipe.draw()

    def off_screen(self):
        return self.top_pipe.rect.right < 0

    def collide(self, shark):
        return self.top_pipe.rect.colliderect(
            shark.rect
        ) or self.bottom_pipe.rect.colliderect(shark.rect)


def main():
    global LAST_PIPE
    shark = BabyShark()
    pipes = []
    score = 0
    font = pygame.font.SysFont("Arial", 28, bold=True)

    # Initialize background position variables for continuous scrolling
    background_x1 = 0
    background_x2 = SCREEN_WIDTH

    running = True
    while running:
        # Update and blit backgrounds for continuous scrolling
        screen.blit(background_img, (background_x1, 0))
        screen.blit(background_img, (background_x2, 0))
        background_x1 -= 2
        background_x2 -= 2
        if background_x1 <= -SCREEN_WIDTH:
            background_x1 = SCREEN_WIDTH
        if background_x2 <= -SCREEN_WIDTH:
            background_x2 = SCREEN_WIDTH

        # Event handling
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_SPACE:
                    shark.flap()

        # Check for adding a new pipe pair
        time_now = pygame.time.get_ticks()
        if time_now - LAST_PIPE > PIPE_FREQUENCY:
            pipes.append(PipePair())
            LAST_PIPE = time_now

        # Update and draw pipes
        for pipe_pair in pipes[:]:
            pipe_pair.update()
            if pipe_pair.off_screen():
                pipes.remove(pipe_pair)
                continue
            pipe_pair.draw()

            # Check for collision
            if pipe_pair.collide(shark):
                running = False

            # Check if the shark has passed the pipe to increment the score
            if not pipe_pair.passed and pipe_pair.top_pipe.rect.right < shark.rect.left:
                pipe_pair.passed = True
                score += 1

        # Update and draw the shark
        shark.update()
        shark.draw()

        # Display the score
        score_surface = font.render(f"Score: {score}", True, WHITE)
        screen.blit(score_surface, (10, 10))

        pygame.display.update()
        clock.tick(FPS)


if __name__ == "__main__":
    main()
