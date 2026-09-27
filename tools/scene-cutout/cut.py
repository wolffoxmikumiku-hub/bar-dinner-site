import sys, json, numpy as np, cv2
from PIL import Image
S="/Users/funakiyui/Desktop/work/Bar&Dinner/bar-dinner-site/public/scenes/"
scene, spec = sys.argv[1], json.loads(sys.argv[2])
img = np.array(Image.open(S+scene+'.webp').convert('RGB'))
bgr = img[..., ::-1].copy()
out = {}
for name, r in spec.items():
    x0,y0,x1,y1 = r['rect']
    mask = np.zeros(img.shape[:2], np.uint8)
    bgd = np.zeros((1,65)); fgd = np.zeros((1,65))
    cv2.grabCut(bgr, mask, (x0,y0,x1-x0,y1-y0), bgd, fgd, 6, cv2.GC_INIT_WITH_RECT)
    for (a,b,c,d_) in r.get('bg',[]): mask[b:d_, a:c] = cv2.GC_BGD
    for (a,b,c,d_) in r.get('fg',[]): mask[b:d_, a:c] = cv2.GC_FGD
    if r.get('bg') or r.get('fg'): cv2.grabCut(bgr, mask, None, bgd, fgd, 4, cv2.GC_INIT_WITH_MASK)
    m = np.where((mask==1)|(mask==3),255,0).astype(np.uint8)
    # keep largest components, close small holes
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((5,5),np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    if n>1:
        keep = [i for i in range(1,n) if st[i,4] > 0.08*st[1:,4].max()]
        m = np.isin(lab, keep).astype(np.uint8)*255
    np.save(f'm-{scene}-{name}.npy', m>0)
    rgba = np.dstack([img, m]); crop = Image.fromarray(rgba).crop((x0,y0,x1,y1))
    bg = Image.new('RGBA', crop.size, (255,0,255,255)); bg.alpha_composite(crop)
    bg.convert('RGB').resize((crop.width*2, crop.height*2), Image.NEAREST).save(f'cut-{scene}-{name}.png')
    print(name, (m>0).sum())
