import sys, json, numpy as np, cv2
from PIL import Image
S="/Users/funakiyui/Desktop/work/Bar&Dinner/bar-dinner-site/public/scenes/"
scene=sys.argv[1]; spec=json.load(open(sys.argv[2]))
img=np.array(Image.open(S+scene+'.webp').convert('RGB')); bgr=img[...,::-1].copy()
for name,r in spec.items():
    mask=np.zeros(img.shape[:2],np.uint8)
    if 'poly' in r:
        pts=np.array(r['poly'],np.int32); o=r.get('zoom')
        if o: pts=np.array([[o[0]+x/o[2], o[1]+y/o[2]] for x,y in r['poly']],np.int32)
        mask[:]=cv2.GC_BGD; cv2.fillPoly(mask,[pts],cv2.GC_PR_FGD)
        x0,y0,w,h=cv2.boundingRect(pts); x1,y1=x0+w,y0+h
    else:
        x0,y0,x1,y1=r['rect']; mask[:]=cv2.GC_BGD; mask[y0:y1,x0:x1]=cv2.GC_PR_FGD
    for (a,b,c,d) in r.get('bg',[]): mask[b:d,a:c]=cv2.GC_BGD
    for (a,b,c,d) in r.get('fg',[]): mask[b:d,a:c]=cv2.GC_FGD
    bgd=np.zeros((1,65));fgd=np.zeros((1,65))
    if r.get('raw'): m=np.isin(mask,[1,3]).astype(np.uint8)*255
    else:
        cv2.grabCut(bgr,mask,None,bgd,fgd,6,cv2.GC_INIT_WITH_MASK)
        m=np.isin(mask,[1,3]).astype(np.uint8)*255
    m=cv2.morphologyEx(m,cv2.MORPH_CLOSE,np.ones((5,5),np.uint8))
    n,lab,st,_=cv2.connectedComponentsWithStats(m)
    if n>1:
        keep=[i for i in range(1,n) if st[i,4]>0.08*st[1:,4].max()]; m=np.isin(lab,keep).astype(np.uint8)*255
    # fill holes
    ff=m.copy(); h_,w_=m.shape; fm=np.zeros((h_+2,w_+2),np.uint8); cv2.floodFill(ff,fm,(0,0),255); m=m|(~ff&255)
    np.save(f'm-{scene}-{name}.npy',m>0)
    rgba=np.dstack([img,m]); crop=Image.fromarray(rgba).crop((x0-4,y0-4,x1+4,y1+4))
    bg=Image.new('RGBA',crop.size,(255,0,255,255)); bg.alpha_composite(crop)
    bg.convert('RGB').resize((crop.width*2,crop.height*2),Image.NEAREST).save(f'cut-{scene}-{name}.png')
    print(name,(m>0).sum(),(x0,y0,x1,y1))
