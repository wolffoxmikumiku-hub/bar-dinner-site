import json, numpy as np, cv2
from PIL import Image
S="/Users/funakiyui/Desktop/work/Bar&Dinner/bar-dinner-site/public/scenes/"
OUT=S+"sprites/"
import os; os.makedirs(OUT,exist_ok=True)
def fill_holes(m):
    m=m.astype(np.uint8)*255; ff=m.copy(); h,w=m.shape; fm=np.zeros((h+2,w+2),np.uint8)
    cv2.floodFill(ff,fm,(0,0),255); return (m|(~ff&255))>0
meta={}
for scene,names in [('diner-1f',['bison','owl','squirrel','bunny','fox','raccoon1','raccoon2','waitress']),('bar-b1',['owl','raccoon','bat','mouse','mole','firefly'])]:
    img=np.array(Image.open(S+scene+'.webp').convert('RGB'))
    masks={n:fill_holes(np.load(f'm-{scene}-{n}.npy')) for n in names}
    if scene=='diner-1f': masks['bison']&=~masks['waitress']
    meta[scene]={}
    for n in names:
        m=masks[n]; ys,xs=np.nonzero(m); x0,x1,y0,y1=xs.min(),xs.max()+1,ys.min(),ys.max()+1
        rgba=np.dstack([img,m*255]).astype(np.uint8)[y0:y1,x0:x1]
        Image.fromarray(rgba).save(OUT+f'{scene}-{n}.webp',lossless=True)
        meta[scene][n]=[int(x0),int(y0),int(x1-x0),int(y1-y0)]
plate=np.load('plate-wip2.npy')
Image.fromarray(plate).save(S+'diner-1f-open.webp',quality=92)
json.dump(meta,open('meta.json','w')); print(json.dumps(meta))
