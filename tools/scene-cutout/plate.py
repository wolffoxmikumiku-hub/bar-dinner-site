import sys, glob, numpy as np, cv2
from PIL import Image
S="/Users/funakiyui/Desktop/work/Bar&Dinner/bar-dinner-site/public/scenes/"
scene=sys.argv[1]; names=sys.argv[2:]
img=np.array(Image.open(S+scene+'.webp').convert('RGB'))
M=np.zeros(img.shape[:2],np.uint8)
for n in names:
    m=np.load(f'm-{scene}-{n}.npy').astype(np.uint8); k=9 if n=='waitress' else 5
    M|=cv2.dilate(m,np.ones((k,k),np.uint8))
out=cv2.inpaint(img[...,::-1].copy(),M*255,6,cv2.INPAINT_TELEA)[...,::-1]
Image.fromarray(out).save(f'plate-{scene}.png'); np.save(f'hole-{scene}.npy',M>0)
Image.fromarray(out).crop((300,0,1120,768)).save(f'plate-{scene}-v.png')
