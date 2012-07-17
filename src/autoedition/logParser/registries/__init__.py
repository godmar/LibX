import os

def import_regs():
    for registry in os.listdir(os.path.dirname(__file__)):
        if registry.endswith(".py") and registry != "__init__.py":
            __import__(".".join([__name__, os.path.basename(registry)[:-3]]), level=-1)
import_regs()
