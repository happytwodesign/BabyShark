import pygame
import sys
import random
import os

# Initialize pygame
pygame.init()

# Screen dimensions and settings
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 600
FPS = 60
PIPE_HEIGHT = 150
PIPE_WIDTH = 80
GIF_FRAME_DELAY = 200  # Delay in milliseconds between GIF frames

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
BUTTON_COLOR = (232, 70, 148)
BUTTON_TEXT_COLOR = WHITE
SKY_BLUE = (135, 206, 235)

# Game parameters
GRAVITY = 0.25
FLAP_POWER = -5
PIPE_SPEED = 2
PIPE_GAP = 200
PIPE_FREQUENCY = 2000
LAST_PIPE = pygame.time.get_ticks()
LAST_FRAME = pygame.time.get_ticks()

# Set up the screen
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
pygame.display.set_caption("Flappy Baby Shark")


# Function to check if a file exists
def check_file_exists(file_path):
    if not os.path.exists(file_path):
        print(f"Error: Unable to load {file_path}")
        sys.exit()


# Load images
try:
    check_file_exists("baby_shark.png")
    check_file_exists("background.png")
    check_file_exists("bubble.png")
    check_file_exists("jellyfish_frame_0.png")
    check_file_exists("jellyfish_frame_1.png")
    check_file_exists("jellyfish_frame_2.png")
    check_file_exists("jellyfish_frame_3.png")

    baby_shark_img = pygame.image.load("baby_shark.png").convert_alpha()
    background_img = pygame.image.load("background.png").convert()
    bubble_img = pygame.image.load("bubble.png").convert_alpha()

    # Load GIF frames
    jellyfish_frames = [
        pygame.image.load(f"jellyfish_frame_{i}.png").convert_alpha() for i in range(4)
    ]
except:
    print("Error: Unable to load one or more images.")
    sys.exit()

# Scale images
baby_shark_img = pygame.transform.scale(baby_shark_img, (80, 40))
background_img = pygame.transform.scale(background_img, (SCREEN_WIDTH, SCREEN_HEIGHT))
bubble_img = pygame.transform.scale(bubble_img, (20, 20))  # Scale bubble image
jellyfish_frames = [
    pygame.transform.scale(frame, (PIPE_WIDTH, PIPE_HEIGHT))
    for frame in jellyfish_frames
]

# Clock
clock = pygame.time.Clock()

# Background position variables for continuous scrolling
background_x1 = 0
background_x2 = SCREEN_WIDTH

# Button dimensions
BUTTON_WIDTH = 200
BUTTON_HEIGHT = 50
BUTTON_RADIUS = 10


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


class Bubble:
    def __init__(self, x, y):
        self.original_image = bubble_img
        self.scale_factor = random.uniform(
            0.5, 1.0
        )  # Random scale factor between 0.5 and 1.0
        self.image = pygame.transform.scale(
            self.original_image,
            (int(20 * self.scale_factor), int(20 * self.scale_factor)),
        )
        self.rect = self.image.get_rect(center=(x, y))
        self.speed = random.randint(1, 3)

    def update(self):
        self.rect.y -= self.speed
        if self.rect.bottom < 0:
            self.rect.y = SCREEN_HEIGHT + 20

    def draw(self):
        screen.blit(self.image, self.rect)


class Pipe:
    def __init__(self, inverted, y):
        self.images = jellyfish_frames
        self.frame_index = 0
        self.image = self.images[self.frame_index]
        self.rect = self.image.get_rect()
        if inverted:
            self.rect.bottomleft = (SCREEN_WIDTH, y - PIPE_GAP // 2)
        else:
            self.rect.topleft = (SCREEN_WIDTH, y + PIPE_GAP // 2)

    def update(self):
        global LAST_FRAME
        self.rect.x -= PIPE_SPEED

        # Update frame based on time delay
        time_now = pygame.time.get_ticks()
        if time_now - LAST_FRAME > GIF_FRAME_DELAY:
            self.frame_index = (self.frame_index + 1) % len(self.images)
            self.image = self.images[self.frame_index]
            LAST_FRAME = time_now

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


def draw_button(screen, text, x, y, width, height, radius, color, text_color):
    button_rect = pygame.Rect(x, y, width, height)
    pygame.draw.rect(screen, color, button_rect, border_radius=radius)
    pygame.draw.rect(screen, BLACK, button_rect, 2, border_radius=radius)

    font = pygame.font.SysFont("Arial", 28, bold=True)
    text_surface = font.render(text, True, text_color)
    text_rect = text_surface.get_rect(center=(x + width // 2, y + height // 2))
    screen.blit(text_surface, text_rect)

    return button_rect


def main():
    global LAST_PIPE
    shark = BabyShark()
    pipes = []
    bubbles = [
        Bubble(random.randint(0, SCREEN_WIDTH), random.randint(0, SCREEN_HEIGHT))
        for _ in range(20)
    ]
    score = 0
    font = pygame.font.SysFont("Arial", 28, bold=True)

    # Initialize background position variables for continuous scrolling
    background_x1 = 0
    background_x2 = SCREEN_WIDTH

    running = True
    game_over = False

    while running:
        if game_over:
            screen.blit(background_img, (0, 0))
            game_over_surface = font.render(f"Game Over!", True, WHITE)
            score_surface = font.render(f"Score: {score}", True, WHITE)
            screen.blit(
                game_over_surface,
                (
                    SCREEN_WIDTH // 2 - game_over_surface.get_width() // 2,
                    SCREEN_HEIGHT // 2 - 100,
                ),
            )
            screen.blit(
                score_surface,
                (
                    SCREEN_WIDTH // 2 - score_surface.get_width() // 2,
                    SCREEN_HEIGHT // 2 - 50,
                ),
            )

            start_over_rect = draw_button(
                screen,
                "Start Over",
                SCREEN_WIDTH // 2 - BUTTON_WIDTH // 2,
                SCREEN_HEIGHT // 2,
                BUTTON_WIDTH,
                BUTTON_HEIGHT,
                BUTTON_RADIUS,
                BUTTON_COLOR,
                BUTTON_TEXT_COLOR,
            )
            prompt_surface = font.render(
                "Press SPACE or TAP to start over", True, WHITE
            )
            screen.blit(
                prompt_surface,
                (
                    SCREEN_WIDTH // 2 - prompt_surface.get_width() // 2,
                    SCREEN_HEIGHT // 2 + BUTTON_HEIGHT + 10,
                ),
            )

            pygame.display.update()

            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    pygame.quit()
                    sys.exit()
                if event.type == pygame.KEYDOWN and event.key == pygame.K_SPACE:
                    main()
                if event.type == pygame.MOUSEBUTTONDOWN:
                    if start_over_rect.collidepoint(event.pos):
                        main()

            clock.tick(FPS)
            continue

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
            if event.type == pygame.MOUSEBUTTONDOWN:
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
                game_over = True

            # Check if the shark has passed the pipe to increment the score
            if not pipe_pair.passed and pipe_pair.top_pipe.rect.right < shark.rect.left:
                pipe_pair.passed = True
                score += 1

        # Update and draw bubbles
        for bubble in bubbles:
            bubble.update()
            bubble.draw()

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
