
import sys
sys.path.insert(0, "/opt/homebrew/lib/python3.14/site-packages")

# 禁用 battery saver
import mflux.callbacks.instances.battery_saver as bs
original_call = bs.BatterySaver.call_before_loop
bs.BatterySaver.call_before_loop = lambda *args, **kwargs: None

# 运行原始 mflux-generate
from mflux.models.flux.cli import flux_generate
flux_generate.main()
