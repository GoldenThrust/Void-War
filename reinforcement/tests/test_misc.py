import unittest

from core.ships.manager import ShipManager
from core.utils.misc import is_visible
from core.world.canvas import canvas
from core.world.world import world


class IsVisibleTests(unittest.TestCase):
    def setUp(self):
        self.original_canvas = (canvas.width, canvas.height)
        self.original_world = (world.x, world.y)
        canvas.width = 1920
        canvas.height = 1080
        world.x = 5000
        world.y = 5000

    def tearDown(self):
        canvas.width, canvas.height = self.original_canvas
        world.x, world.y = self.original_world

    def test_object_at_camera_center_is_visible(self):
        self.assertTrue(is_visible(world.x, world.y, radius=40))

    def test_object_inside_screen_is_visible(self):
        self.assertTrue(is_visible(world.x + 100, world.y - 100, radius=40))

    def test_object_outside_screen_is_not_visible(self):
        self.assertFalse(is_visible(world.x + 1200, world.y, radius=40))

    def test_object_across_toroidal_wrap_is_visible(self):
        world.x = 9990
        world.y = 5000
        self.assertTrue(is_visible(10, 5000, radius=40))

    def test_object_across_toroidal_wrap_is_not_visible(self):
        world.x = 9990
        world.y = 5000
        self.assertFalse(is_visible(3000, 5000, radius=40))

    def test_manager_uses_world_coordinates_for_visibility(self):
        world.x = 0
        world.y = 0
        ship = type("Ship", (), {"x": 1000, "y": 0, "height": 40, "render": lambda self: self.rendered.append(True)})()
        ship.rendered = []
        ShipManager.ships = {"ship": ship}

        try:
            ShipManager.render()
            self.assertEqual(ship.rendered, [True])
        finally:
            ShipManager.ships = {}


if __name__ == "__main__":
    unittest.main()
