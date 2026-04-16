# Six professional color palettes. Each palette has:
# primary: dark header color (hex without #, e.g. "1e3a5f")
# secondary: medium sub-header color
# light: pale fill for alternating rows
# accent: contrasting highlight color
# font_header: white or dark for header text
# name: display name

PALETTES = {
    'navy': {
        'name': 'Azul Marino',
        'primary': '1e3a5f',
        'secondary': '2d5986',
        'light': 'dbeafe',
        'accent': 'f59e0b',
        'font_header': 'FFFFFF',
    },
    'green': {
        'name': 'Verde Institucional',
        'primary': '14532d',
        'secondary': '166534',
        'light': 'dcfce7',
        'accent': '6366f1',
        'font_header': 'FFFFFF',
    },
    'red': {
        'name': 'Rojo Corporativo',
        'primary': '7f1d1d',
        'secondary': '991b1b',
        'light': 'fee2e2',
        'accent': '0ea5e9',
        'font_header': 'FFFFFF',
    },
    'purple': {
        'name': 'Morado Ejecutivo',
        'primary': '4c1d95',
        'secondary': '5b21b6',
        'light': 'ede9fe',
        'accent': '10b981',
        'font_header': 'FFFFFF',
    },
    'slate': {
        'name': 'Gris Carbon',
        'primary': '1f2937',
        'secondary': '374151',
        'light': 'f3f4f6',
        'accent': '3b82f6',
        'font_header': 'FFFFFF',
    },
    'orange': {
        'name': 'Naranja Ejecutivo',
        'primary': '7c2d12',
        'secondary': '9a3412',
        'light': 'ffedd5',
        'accent': '3b82f6',
        'font_header': 'FFFFFF',
    },
}

DEFAULT_PALETTE = 'navy'


def get_palette(key: str) -> dict:
    return PALETTES.get(key, PALETTES[DEFAULT_PALETTE])
